const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../middleware/auditLogger');
const { UPLOAD_DIR } = require('../middleware/documentUpload.middleware');
const { detectMime } = require('../utils/fileSignature');
const { DOC_TYPES, DELETE_ROLES, canAccess, typesForRole } = require('../config/documentAccess');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const removeFile = (p) => fs.unlink(p, () => {});

// Which types the current user may see (drives the frontend dropdowns/tabs)
const getTypes = (req, res) => {
  const types = typesForRole(req.user.role).map((key) => ({
    key,
    label: DOC_TYPES[key].label,
    sensitive: DOC_TYPES[key].sensitive,
  }));
  res.status(200).json({ success: true, data: { types, canDelete: DELETE_ROLES.includes(req.user.role) } });
};

const listDocuments = async (req, res, next) => {
  try {
    const allowed = typesForRole(req.user.role);
    if (allowed.length === 0) throw new ApiError(403, 'You do not have access to documents');

    const { docType, search } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 24);

    const filter = { docType: { $in: allowed } };
    if (docType) {
      if (!allowed.includes(docType)) throw new ApiError(403, 'You do not have access to this document type');
      filter.docType = docType;
    }
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: rx }, { relatedLabel: rx }, { fileName: rx }];
    }

    const [docs, total] = await Promise.all([
      Document.find(filter).select('-storedName').populate('uploadedBy', 'firstName lastName role')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Document.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, data: docs, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  const file = req.file;
  try {
    if (!file) throw new ApiError(400, 'No file uploaded');

    const { title, docType, relatedLabel, relatedModel, relatedId, notes } = req.body;
    if (!title || !title.trim()) throw new ApiError(400, 'Document title is required');
    if (!DOC_TYPES[docType]) throw new ApiError(400, 'Invalid document type');
    if (!canAccess(req.user.role, docType)) throw new ApiError(403, `Your role cannot upload ${DOC_TYPES[docType].label} documents`);

    // Verify the real file content matches what the browser claimed
    const realMime = await detectMime(file.path);
    if (!realMime || realMime !== file.mimetype) throw new ApiError(400, 'File content does not match its file type');

    const doc = await Document.create({
      title: title.trim(),
      docType,
      isSensitive: DOC_TYPES[docType].sensitive,
      fileName: path.basename(file.originalname).slice(0, 150),
      storedName: file.filename,
      mimeType: realMime,
      size: file.size,
      relatedLabel: relatedLabel?.trim() || undefined,
      relatedModel: relatedModel || undefined,
      relatedId: relatedId && mongoose.isValidObjectId(relatedId) ? relatedId : undefined,
      notes: notes?.slice(0, 500),
      uploadedBy: req.user._id,
    });

    await logAction({
      action: 'DOCUMENT_UPLOADED', module: 'documents', req,
      targetType: 'Document', targetId: doc._id, targetLabel: doc.title,
      description: `Uploaded ${DOC_TYPES[docType].label}: ${doc.title}`,
      details: { docType, sensitive: doc.isSensitive, size: doc.size },
    });

    const safe = doc.toObject();
    delete safe.storedName;
    res.status(201).json({ success: true, message: 'Document uploaded', data: safe });
  } catch (error) {
    if (file) removeFile(file.path); // never leave a rejected file on disk
    next(error);
  }
};

// Preview (inline) and download (attachment). Every access is audit-logged.
const streamFile = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) throw new ApiError(404, 'Document not found');
    if (!canAccess(req.user.role, doc.docType)) {
      await logAction({
        action: 'DOCUMENT_ACCESS_DENIED', module: 'documents', req,
        targetType: 'Document', targetId: doc._id, targetLabel: doc.title,
        description: `Blocked access to ${DOC_TYPES[doc.docType].label}: ${doc.title}`,
        details: { docType: doc.docType, sensitive: doc.isSensitive },
      });
      throw new ApiError(403, 'You do not have permission to open this document');
    }

    const download = req.query.download === 'true';
    await logAction({
      action: download ? 'DOCUMENT_DOWNLOADED' : 'DOCUMENT_VIEWED', module: 'documents', req,
      targetType: 'Document', targetId: doc._id, targetLabel: doc.title,
      description: `${download ? 'Downloaded' : 'Viewed'} ${DOC_TYPES[doc.docType].label}: ${doc.title}`,
      details: { docType: doc.docType, sensitive: doc.isSensitive },
    });

    const filePath = path.join(UPLOAD_DIR, path.basename(doc.storedName)); // basename blocks traversal
    res.sendFile(
      filePath,
      {
        headers: {
          'Content-Type': doc.mimeType,
          'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
      (err) => {
        if (err && !res.headersSent) next(new ApiError(404, 'File is missing on the server'));
      }
    );
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) throw new ApiError(404, 'Document not found');
    if (!canAccess(req.user.role, doc.docType)) throw new ApiError(403, 'You do not have permission to delete this document');

    removeFile(path.join(UPLOAD_DIR, path.basename(doc.storedName)));
    await doc.deleteOne();

    await logAction({
      action: 'DOCUMENT_DELETED', module: 'documents', req,
      targetType: 'Document', targetId: doc._id, targetLabel: doc.title,
      description: `Deleted ${DOC_TYPES[doc.docType].label}: ${doc.title}`,
      oldValue: { title: doc.title, fileName: doc.fileName, docType: doc.docType },
      details: { sensitive: doc.isSensitive },
    });

    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};

// Who has opened this document? (managers and super admin only)
const getAccessLog = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).select('title docType');
    if (!doc) throw new ApiError(404, 'Document not found');

    const logs = await AuditLog.find({ targetType: 'Document', targetId: doc._id })
      .sort({ createdAt: -1 }).limit(100)
      .select('action userName userRole ipAddress createdAt description');

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTypes, listDocuments, uploadDocument, streamFile, deleteDocument, getAccessLog };