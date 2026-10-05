const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/accountant.controller');

const router = express.Router();
router.use(protect, authorize('accountant', 'hotel_manager', 'super_admin'));

router.get('/dashboard', c.getDashboard);

router.get('/payments', c.getAllPayments);
router.post('/payments/refund', c.processRefund);

router.get('/invoices/:bookingId', c.getInvoice);
router.post('/invoices/:bookingId/adjustment', c.applyAdjustment);

// Expenses
router.get('/expenses', requirePermission('expenses', 'approve', 'request'), c.getExpenses);
router.post('/expenses', requirePermission('expenses', 'request'), c.createExpense);
router.patch('/expenses/:id/approve', requirePermission('expenses', 'approve'), c.approveExpense);
router.delete('/expenses/:id', requirePermission('expenses'), c.deleteExpense);

router.get('/reports/revenue', c.getRevenueReport);
router.get('/reports/profit-loss', c.getProfitLossReport);
router.get('/reports/outstanding', c.getOutstandingReport);

module.exports = router;