const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/admin.controller');

const router = express.Router();
router.use(protect);

// System = Admin: Full only
router.get('/dashboard', requirePermission('system'), c.getDashboardStats);

// Users = Admin: Full, Manager: Limited (read-only, no create/delete/reset-password/deactivate)
router.get('/users', requirePermission('users', 'limited'), c.getAllUsers);
router.post('/users', requirePermission('users'), c.createStaffUser);              // full only
router.put('/users/:id', requirePermission('users'), c.updateUser);                // full only
router.patch('/users/:id/toggle-status', requirePermission('users'), c.toggleUserStatus); // full only
router.patch('/users/:id/reset-password', requirePermission('users'), c.resetUserPassword); // full only
router.delete('/users/:id', requirePermission('users'), c.deleteUser);             // full only

// Roles = Admin: Full only
router.get('/audit-logs', requirePermission('audit_logs', 'view'), c.getAuditLogs);

module.exports = router;