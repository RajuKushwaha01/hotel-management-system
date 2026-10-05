const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/inventory.controller');

const router = express.Router();
router.use(protect);

router.get('/dashboard', requirePermission('inventory'), c.getDashboard); // full only (Admin/Manager)
router.get('/categories', requirePermission('inventory', 'own_dept', 'fnb', 'kitchen', 'maintenance', 'view'), c.getCategories);
router.get('/low-stock', requirePermission('inventory', 'own_dept', 'fnb', 'kitchen', 'maintenance', 'view'), c.getLowStockItems);

router.get('/items', requirePermission('inventory', 'own_dept', 'fnb', 'kitchen', 'maintenance', 'view'), c.getItems);
router.post('/items', requirePermission('inventory'), c.createItem);       // full only
router.put('/items/:id', requirePermission('inventory'), c.updateItem);    // full only
router.delete('/items/:id', requirePermission('inventory'), c.deleteItem); // full only
router.get('/items/:itemId/history', requirePermission('inventory', 'own_dept', 'fnb', 'kitchen', 'maintenance', 'view'), c.getItemHistory);

// Stock movements — restricted per department in the controller (see patch below)
router.post('/stock-in', requirePermission('inventory', 'own_dept', 'fnb', 'kitchen', 'maintenance'), c.stockIn);
router.post('/stock-out', requirePermission('inventory', 'own_dept', 'fnb', 'kitchen', 'maintenance'), c.stockOut);
router.post('/wastage', requirePermission('inventory', 'own_dept', 'fnb', 'kitchen', 'maintenance'), c.recordWastage);

module.exports = router;