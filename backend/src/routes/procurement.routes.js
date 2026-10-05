const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/procurement.controller');

const router = express.Router();
router.use(protect);

router.get('/suppliers', requirePermission('suppliers', 'manage', 'request', 'view'), c.getSuppliers);
router.post('/suppliers', requirePermission('suppliers'), c.createSupplier);    // full only
router.put('/suppliers/:id', requirePermission('suppliers'), c.updateSupplier); // full only
router.get('/suppliers/:id/history', requirePermission('suppliers'), c.getSupplierPurchaseHistory); // full only

// Purchase requests = the "Request" level (F&B/Chef/Maintenance submit; Manager approves)
router.get('/requests', requirePermission('suppliers', 'manage', 'request'), c.getPurchaseRequests);
router.post('/requests', requirePermission('suppliers', 'request'), c.createPurchaseRequest);
router.patch('/requests/:id/approve', requirePermission('suppliers', 'manage'), c.approvePurchaseRequest);
router.patch('/requests/:id/reject', requirePermission('suppliers', 'manage'), c.rejectPurchaseRequest);

// Purchase orders = Manage level and above only
router.get('/orders', requirePermission('suppliers', 'manage'), c.getPurchaseOrders);
router.post('/orders', requirePermission('suppliers', 'manage'), c.createPurchaseOrder);
router.patch('/orders/:id/send', requirePermission('suppliers', 'manage'), c.sendPOToSupplier);
router.patch('/orders/:id/receive', requirePermission('suppliers', 'manage'), c.receiveGoods);
router.patch('/orders/:id/close', requirePermission('suppliers', 'manage'), c.closePurchaseOrder);

module.exports = router;