const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/backup.controller');

const router = express.Router();
router.use(protect, authorize('super_admin')); // super admin only — most sensitive route in the system

router.get('/', c.getBackupHistory);
router.post('/run', c.runBackup);
router.get('/:id/download', c.downloadBackup);
router.post('/:id/restore', c.restoreBackup);

module.exports = router;