const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/rateManagement.controller');

const router = express.Router();

router.get('/room-rates', protect, authorize('super_admin', 'hotel_manager', 'receptionist'), c.getRoomRates);
router.put('/room-rates', protect, authorize('super_admin', 'hotel_manager'), c.upsertRoomRate);

router.get('/rate-plans', protect, authorize('super_admin', 'hotel_manager', 'receptionist'), c.getRatePlans);
router.post('/rate-plans', protect, authorize('super_admin', 'hotel_manager'), c.createRatePlan);
router.put('/rate-plans/:id', protect, authorize('super_admin', 'hotel_manager'), c.updateRatePlan);
router.delete('/rate-plans/:id', protect, authorize('super_admin', 'hotel_manager'), c.deleteRatePlan);

router.get('/calculate', protect, authorize('super_admin', 'hotel_manager', 'receptionist'), c.calculateRate);

module.exports = router;