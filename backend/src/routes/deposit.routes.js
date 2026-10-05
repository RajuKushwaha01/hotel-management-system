const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/deposit.controller');

const router = express.Router();
router.use(protect);

router.get('/', requirePermission('payments', 'view', 'collect'), c.getDeposits);
router.post('/', requirePermission('payments', 'collect'), c.createDeposit);
router.patch('/:id/request-refund', requirePermission('payments', 'collect'), c.requestRefund);

// Refund approval/processing is a "Full" billing action — Admin/Accountant only
router.patch('/:id/approve-refund', requirePermission('payments'), c.approveRefund);
router.patch('/:id/process-refund', requirePermission('payments'), c.processRefund);
router.patch('/:id/reject-refund', requirePermission('payments'), c.rejectRefund);

module.exports = router;