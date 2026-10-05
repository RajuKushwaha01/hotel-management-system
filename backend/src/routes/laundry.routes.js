const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/laundry.controller');

const router = express.Router();
router.use(protect);

router.get('/', requirePermission('laundry', 'manage', 'request', 'view'), c.getLaundryRequests);
router.post('/', requirePermission('laundry', 'manage', 'request'), c.createLaundryRequest);
router.patch('/:id/status', requirePermission('laundry', 'manage'), c.updateLaundryStatus);

module.exports = router;