const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/staff.controller');

const router = express.Router();
router.use(protect, requirePermission('staff', 'manage')); // Admin: full, Manager: manage — everyone else blocked

router.get('/', c.getAllStaff);
router.post('/', c.createStaffProfile);
router.get('/:id', c.getStaffProfile);
router.put('/:id', c.updateStaffProfile);
router.post('/:id/documents', c.addDocument);
router.delete('/:id/documents/:docId', c.removeDocument);

module.exports = router;