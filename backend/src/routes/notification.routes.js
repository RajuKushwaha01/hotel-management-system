const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const c = require('../controllers/notification.controller');

const router = express.Router();
router.use(protect);

router.get('/', c.getMyNotifications);
router.patch('/:id/read', c.markAsRead);
router.patch('/read-all', c.markAllAsRead);
router.patch('/:id/archive', c.archiveNotification);

module.exports = router;