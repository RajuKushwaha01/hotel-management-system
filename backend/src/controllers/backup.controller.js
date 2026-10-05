const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const BackupLog = require('../models/BackupLog');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../middleware/auditLogger');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Exports every collection to a single timestamped JSON file (works with the free MongoDB Atlas tier,
// no mongodump binary required). For large production data, swap this for Atlas' own snapshot backups.
const runBackup = async (req, res, next) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const dump = {};
    let totalDocs = 0;

    for (const { name } of collections) {
      const docs = await mongoose.connection.db.collection(name).find({}).toArray();
      dump[name] = docs;
      totalDocs += docs.length;
    }

    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);
    const json = JSON.stringify(dump);
    fs.writeFileSync(filePath, json);

    const log = await BackupLog.create({
      type: 'manual', status: 'completed',
      collections: collections.map((c) => c.name),
      sizeBytes: Buffer.byteLength(json),
      fileName, triggeredBy: req.user._id,
      notes: `${totalDocs} documents across ${collections.length} collections`,
    });

    await logAction({ action: 'BACKUP_CREATED', module: 'system', req, targetType: 'BackupLog', targetId: log._id, targetLabel: fileName, description: `Manual backup created (${collections.length} collections, ${totalDocs} docs)` });

    res.status(201).json({ success: true, message: 'Backup completed', data: log });
  } catch (error) {
    await BackupLog.create({ type: 'manual', status: 'failed', triggeredBy: req.user._id, notes: error.message });
    next(error);
  }
};

const getBackupHistory = async (req, res, next) => {
  try {
    const logs = await BackupLog.find().populate('triggeredBy', 'firstName lastName').sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, data: logs });
  } catch (error) { next(error); }
};

const downloadBackup = async (req, res, next) => {
  try {
    const log = await BackupLog.findById(req.params.id);
    if (!log || log.status !== 'completed') throw new ApiError(404, 'Backup file not found');

    const filePath = path.join(BACKUP_DIR, path.basename(log.fileName));
    if (!fs.existsSync(filePath)) throw new ApiError(404, 'Backup file is no longer available on this server');

    await logAction({ action: 'BACKUP_DOWNLOADED', module: 'system', req, targetType: 'BackupLog', targetId: log._id, targetLabel: log.fileName, description: `Downloaded backup ${log.fileName}` });

    res.download(filePath, log.fileName);
  } catch (error) { next(error); }
};

// Restore is deliberately staged behind a confirmation step and full audit trail —
// this is the most destructive action in the whole system.
const restoreBackup = async (req, res, next) => {
  try {
    const { confirmPhrase } = req.body;
    if (confirmPhrase !== 'RESTORE') throw new ApiError(400, 'Type RESTORE exactly to confirm this irreversible action');

    const log = await BackupLog.findById(req.params.id);
    if (!log || log.status !== 'completed') throw new ApiError(404, 'Backup file not found');

    const filePath = path.join(BACKUP_DIR, path.basename(log.fileName));
    if (!fs.existsSync(filePath)) throw new ApiError(404, 'Backup file is no longer available on this server');

    const dump = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const [collectionName, docs] of Object.entries(dump)) {
      const coll = mongoose.connection.db.collection(collectionName);
      await coll.deleteMany({});
      if (docs.length > 0) await coll.insertMany(docs);
    }

    await logAction({ action: 'BACKUP_RESTORED', module: 'system', req, targetType: 'BackupLog', targetId: log._id, targetLabel: log.fileName, description: `Restored database from backup ${log.fileName}` });

    res.status(200).json({ success: true, message: 'Database restored successfully. Please log in again.' });
  } catch (error) { next(error); }
};

module.exports = { runBackup, getBackupHistory, downloadBackup, restoreBackup };