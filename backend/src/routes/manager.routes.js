const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getManagerDashboard,
  getAllBookings,
  approveBooking,
  cancelBooking,
  reassignRoom,
} = require('../controllers/manager.controller');

const router = express.Router();

// Manager routes are also accessible to super_admin (oversight)
router.use(protect, authorize('hotel_manager', 'super_admin'));

router.get('/dashboard', getManagerDashboard);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/approve', approveBooking);
router.patch('/bookings/:id/cancel', cancelBooking);
router.patch('/bookings/:id/reassign-room', reassignRoom);

module.exports = router;