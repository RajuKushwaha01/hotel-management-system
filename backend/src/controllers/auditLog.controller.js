const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../middleware/auditLogger');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (q) => {
  const { user, module, action, targetType, from, to, search } = q;
  const filter = {};
  if (user) filter.user = user;
  if (module) filter.module = module;
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) { const end = new Date(to); end.setHours(23, 59, 59, 999); filter.createdAt.$lte = end; }
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ description: rx }, { userName: rx }, { targetLabel: rx }, { action: rx }];
  }
  return filter;
};

const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const filter = buildFilter(req.query);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, data: logs, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const getAuditStats = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [total, last24h, failedLogins, sensitiveAccess, byModule] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: since } }),
      AuditLog.countDocuments({ action: 'LOGIN_FAILED', createdAt: { $gte: since } }),
      AuditLog.countDocuments({ action: { $in: ['DOCUMENT_VIEWED', 'DOCUMENT_DOWNLOADED'] }, 'details.sensitive': true, createdAt: { $gte: since } }),
      AuditLog.aggregate([{ $group: { _id: '$module', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

    res.status(200).json({
      success: true,
      data: { total, last24h, failedLogins, sensitiveAccess, byModule: byModule.map((m) => ({ module: m._id, count: m.count })) },
    });
  } catch (error) {
    next(error);
  }
};

const getFilterOptions = async (req, res, next) => {
  try {
    const [modules, actions] = await Promise.all([AuditLog.distinct('module'), AuditLog.distinct('action')]);
    res.status(200).json({ success: true, data: { modules: modules.sort(), actions: actions.sort() } });
  } catch (error) {
    next(error);
  }
};

const csvCell = (v) => {
  if (v === undefined || v === null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  // Prefix formula-like values so spreadsheets do not execute them
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

const exportAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find(buildFilter(req.query)).sort({ createdAt: -1 }).limit(5000);

    const header = ['When', 'Who', 'Role', 'Action', 'Module', 'Description', 'Target', 'Old Value', 'New Value', 'IP', 'Session'];
    const rows = logs.map((l) => [
      l.createdAt.toISOString(), l.userName, l.userRole, l.action, l.module, l.description,
      l.targetLabel || l.targetType, l.oldValue, l.newValue, l.ipAddress, l.sessionId,
    ].map(csvCell).join(','));

    await logAction({
      action: 'AUDIT_EXPORTED', module: 'audit', req,
      description: `Exported ${logs.length} audit log entries`,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.status(200).send([header.join(','), ...rows].join('\n'));
  } catch (error) {
    next(error);
  }
};

const getAuditLogById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) throw new ApiError(404, 'Audit entry not found');
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs, getAuditStats, getFilterOptions, exportAuditLogs, getAuditLogById };