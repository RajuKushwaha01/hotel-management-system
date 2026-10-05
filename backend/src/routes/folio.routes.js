const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/folio.controller');

const router = express.Router();
router.use(protect);

// Billing = Admin: Full, Manager: View, Reception/F&B: Create, Accountant: Full
router.get('/:bookingId', requirePermission('billing', 'view', 'create'), c.getFolioByBooking);
router.post('/:bookingId/charge', requirePermission('billing', 'create'), c.addChargeToFolio);
router.post('/:bookingId/discount', requirePermission('billing'), c.applyDiscount); // full only (Accountant/Admin)
router.get('/:bookingId/receipt', requirePermission('billing', 'view', 'create'), c.getReceiptData);

// Payments = Admin: Full, Manager: View, Reception/F&B: Collect, Accountant: Full
router.post('/:bookingId/payment', requirePermission('payments', 'collect'), c.collectFolioPayment);

module.exports = router;