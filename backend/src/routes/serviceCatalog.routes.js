const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/serviceCatalog.controller');

const router = express.Router();
router.use(protect);

// Read: any staff member (they need to know what services exist to offer/request them)
router.get('/', c.getServices);

// Write: settings-level access (Admin: full, Manager: hotel_level) — same tier as Hotel Settings
router.post('/', requirePermission('settings', 'hotel_level'), c.createService);
router.put('/:id', requirePermission('settings', 'hotel_level'), c.updateService);
router.delete('/:id', requirePermission('settings'), c.deleteService); // full only

module.exports = router;