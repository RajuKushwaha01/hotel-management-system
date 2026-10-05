const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/settings.controller');

const router = express.Router();
router.use(protect, requirePermission('settings', 'hotel_level'));

router.get('/', c.getSettings); // Admin: full, Manager: hotel-level (both can view)

// Only Admin (full) may touch security/backup-adjacent global settings; Manager's "hotel-level"
// covers day-to-day hotel config (currency, tax, check-in/out times, cancellation window).
const HOTEL_LEVEL_KEYS = ['hotel_name', 'currency', 'tax_percent', 'check_in_time', 'check_out_time', 'cancellation_hours', 'email_notifications', 'sms_notifications'];

const guardHotelLevelKey = (req, res, next) => {
  if (req.permissionLevel === 'full') return next();
  const keys = req.body.settings ? req.body.settings.map((s) => s.key) : [req.params.key];
  const outOfScope = keys.filter((k) => !HOTEL_LEVEL_KEYS.includes(k));
  if (outOfScope.length > 0) {
    return res.status(403).json({ success: false, message: `Your role cannot change: ${outOfScope.join(', ')}` });
  }
  next();
};

router.patch('/bulk', guardHotelLevelKey, c.bulkUpdateSettings);
router.patch('/:key', guardHotelLevelKey, c.updateSetting);

module.exports = router;