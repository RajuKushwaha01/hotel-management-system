const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/schema.controller');

const router = express.Router();
router.use(protect, authorize('super_admin')); // raw schema/document data — super admin only

router.get('/stats', c.getDatabaseStats);
router.get('/entities', c.getEntityMap);
router.get('/collections/:modelName', c.getCollectionDetail);

module.exports = router;