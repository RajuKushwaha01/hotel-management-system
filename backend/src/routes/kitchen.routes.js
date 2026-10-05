const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/kitchen.controller');

const router = express.Router();
router.use(protect);

// KOT = Admin: Full, Manager: View, F&B: Create, Chef: Full
router.get('/kot', requirePermission('kot', 'view', 'create'), c.getKOTs);
router.patch('/kot/:id/status', requirePermission('kot'), c.updateKOTStatus); // full only (Chef)

router.patch('/menu/:id/availability', requirePermission('kot'), c.updateFoodAvailability); // full only (Chef)

router.get('/inventory', requirePermission('inventory', 'kitchen'), c.getKitchenInventory);
router.patch('/inventory/:id', requirePermission('inventory', 'kitchen'), c.updateKitchenStock);

module.exports = router;