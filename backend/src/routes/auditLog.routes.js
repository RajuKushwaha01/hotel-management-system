const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/auditLog.controller');

const router = express.Router();
router.use(protect, requirePermission('audit_logs', 'view')); // Admin: full, Manager: view — everyone else blocked

router.get('/stats', c.getAuditStats);
router.get('/filters', c.getFilterOptions);
router.get('/export', requirePermission('audit_logs'), c.exportAuditLogs); // export is a "full" action — Admin only
router.get('/', c.getAuditLogs);
router.get('/:id', c.getAuditLogById);

module.exports = router;