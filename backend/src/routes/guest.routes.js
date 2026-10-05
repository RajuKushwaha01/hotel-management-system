const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/guest.controller');

const router = express.Router();
router.use(protect);

// Guests = Admin/Manager/Reception: Full, Housekeeping/F&B/Accountant: Limited (redacted fields)
router.get('/', requirePermission('guests', 'limited'), c.searchGuests);
router.get('/:id', requirePermission('guests', 'limited'), c.getGuestProfile);
router.get('/:id/history', requirePermission('guests', 'limited'), c.getGuestHistory);

router.post('/', requirePermission('guests'), c.createGuest);     // full only
router.put('/:id', requirePermission('guests'), c.updateGuest);   // full only

module.exports = router;