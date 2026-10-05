const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/restaurant.controller');

const router = express.Router();
router.use(protect);

// Restaurant = Admin/Manager/F&B: Full, Reception/Accountant: View, Chef: Kitchen (menu availability only)
router.get('/tables', requirePermission('restaurant', 'view', 'kitchen'), c.getTables);
router.post('/tables', requirePermission('restaurant'), c.createTable);       // full only
router.put('/tables/:id', requirePermission('restaurant'), c.updateTable);    // full only
router.patch('/tables/merge', requirePermission('restaurant'), c.mergeTables);
router.patch('/tables/:id/split', requirePermission('restaurant'), c.splitTables);

router.get('/menu', requirePermission('restaurant', 'view', 'kitchen'), c.getMenu);
router.post('/menu', requirePermission('restaurant'), c.createMenuItem);       // full only
router.put('/menu/:id', requirePermission('restaurant'), c.updateMenuItem);    // full only
router.delete('/menu/:id', requirePermission('restaurant'), c.deleteMenuItem); // full only

router.get('/orders', requirePermission('restaurant', 'view'), c.getOrders);
router.post('/orders', requirePermission('restaurant'), c.createOrder);        // full only (F&B)
router.patch('/orders/:id/cancel-item', requirePermission('restaurant'), c.cancelOrderItem);
router.patch('/orders/:id/serve', requirePermission('restaurant'), c.serveOrder);
router.patch('/orders/:id/close', requirePermission('billing', 'create'), c.closeOrder); // billing action

module.exports = router;