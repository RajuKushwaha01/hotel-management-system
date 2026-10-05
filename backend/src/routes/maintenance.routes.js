const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/maintenance.controller');

const router = express.Router();
router.use(protect);

router.get('/dashboard', requirePermission('maintenance', 'report'), c.getDashboard);
router.get('/tickets', requirePermission('maintenance', 'report'), c.getTickets);

// Reporting an issue = 'report' level, available to Reception/Housekeeping/F&B/Chef too
router.post('/tickets', requirePermission('maintenance', 'report'), c.createTicket);

// Managing the queue (assign/start/complete/verify/close) = Full only (Admin/Manager/Maintenance)
router.patch('/tickets/:id/assign', requirePermission('maintenance'), c.assignTicket);
router.patch('/tickets/:id/start', requirePermission('maintenance'), c.startWork);
router.patch('/tickets/:id/complete', requirePermission('maintenance'), c.completeTicket);
router.patch('/tickets/:id/verify', requirePermission('maintenance'), c.verifyTicket);
router.patch('/tickets/:id/close', requirePermission('maintenance'), c.closeTicket);

module.exports = router;