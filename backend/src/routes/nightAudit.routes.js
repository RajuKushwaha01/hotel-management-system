const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/nightAudit.controller');

const router = express.Router();
router.use(protect, authorize('hotel_manager', 'super_admin', 'accountant'));

router.get('/checks', c.runChecks);
router.post('/close', c.closeBusinessDay);
router.get('/history', c.getAuditHistory);
router.get('/:id', c.getAuditReport);

module.exports = router;