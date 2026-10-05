const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/transport.controller');

const router = express.Router();
router.use(protect);

router.get('/', requirePermission('transport', 'manage', 'create', 'view'), c.getTransportRequests);
router.post('/', requirePermission('transport', 'create'), c.createTransportRequest); // Reception may create
router.patch('/:id/assign', requirePermission('transport', 'manage'), c.assignDriver);  // Manage only
router.patch('/:id/status', requirePermission('transport', 'manage'), c.updateTransportStatus);

module.exports = router;