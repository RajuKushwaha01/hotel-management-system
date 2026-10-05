const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/housekeeping.controller');

const router = express.Router();
router.use(protect);

router.get('/dashboard', requirePermission('housekeeping', 'view'), c.getDashboard);

router.get('/tasks', requirePermission('housekeeping', 'view'), c.getTasks);
router.post('/tasks', requirePermission('housekeeping'), c.createTask);
router.patch('/tasks/:id/accept', requirePermission('housekeeping'), c.acceptTask);
router.patch('/tasks/:id/start', requirePermission('housekeeping'), c.startCleaning);
router.patch('/tasks/:id/complete', requirePermission('housekeeping'), c.completeCleaning);
router.patch('/tasks/:id/mark-clean', requirePermission('housekeeping'), c.markClean);
router.patch('/tasks/:id/report-damage', requirePermission('housekeeping', 'report'), c.reportDamage);
router.patch('/tasks/:id/report-missing-item', requirePermission('housekeeping'), c.reportMissingItem);

router.get('/inventory', requirePermission('inventory', 'own_dept'), c.getInventory);
router.patch('/inventory/:id', requirePermission('inventory', 'own_dept'), c.updateInventoryStock);

router.get('/lost-found', requirePermission('housekeeping', 'view'), c.getLostFoundItems);
router.post('/lost-found', requirePermission('housekeeping'), c.createLostFoundItem);
router.patch('/lost-found/:id', requirePermission('housekeeping'), c.updateLostFoundStatus);

module.exports = router;