const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/equipment.controller');

const router = express.Router();
router.use(protect, requirePermission('maintenance')); // full only — equipment records are config, not "report"

router.get('/', c.getEquipment);
router.post('/', c.createEquipment);
router.put('/:id', c.updateEquipment);
router.patch('/:id/service', c.logService);
router.delete('/:id', c.deleteEquipment);

module.exports = router;