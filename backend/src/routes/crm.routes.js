const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/crm.controller');

const router = express.Router();
router.use(protect, authorize('hotel_manager', 'super_admin', 'receptionist'));

router.get('/dashboard', c.getCRMDashboard);
router.get('/frequent-guests', c.getFrequentGuests);
router.get('/occasions', c.getUpcomingOccasions);
router.get('/guests/:id', c.getGuestCRMProfile);

module.exports = router;