const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../config/permissionMatrix');
const c = require('../controllers/permissions.controller');

const router = express.Router();

router.get('/mine', protect, c.getMyPermissions); // any logged-in staff member
router.get('/matrix', protect, authorize(ROLES.ADMIN, ROLES.MANAGER), c.getMatrix); // Audit Logs level = view for Manager

module.exports = router;