const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/receptionist.controller');

const router = express.Router();
router.use(protect);

router.get('/dashboard', requirePermission('reservations', 'view'), c.getDashboard);
router.get('/availability', requirePermission('reservations', 'view'), c.checkAvailability);

// Reservations = Admin/Manager/Reception: Full, Accountant: View only
router.get('/bookings', requirePermission('reservations', 'view'), c.searchBookings);
router.get('/bookings/calendar', requirePermission('reservations', 'view'), c.getCalendar);
router.get('/reservations/calendar-grid', requirePermission('reservations', 'view'), c.getReservationCalendar);
router.post('/bookings', requirePermission('reservations'), c.createBooking);                      // full only
router.post('/reservations/group', requirePermission('reservations'), c.createGroupBooking);        // full only
router.put('/bookings/:id', requirePermission('reservations'), c.modifyBooking);                    // full only
router.patch('/bookings/:id/cancel', requirePermission('reservations'), c.cancelBooking);            // full only
router.patch('/bookings/:id/reschedule', requirePermission('reservations'), c.rescheduleBooking);    // full only
router.patch('/bookings/:id/no-show', requirePermission('reservations'), c.markNoShow);              // full only

// Check-in/out = Admin/Manager/Reception: Full, Accountant: View only
router.patch('/bookings/:id/check-in', requirePermission('checkinout'), c.checkInGuest);
router.patch('/bookings/:id/change-room', requirePermission('checkinout'), c.changeRoom);
router.patch('/bookings/:id/extend-stay', requirePermission('checkinout'), c.extendStay);
router.patch('/bookings/:id/add-guest', requirePermission('checkinout'), c.addAdditionalGuest);
router.patch('/bookings/:id/check-out', requirePermission('checkinout'), c.checkOutGuest);

// Billing = Reception: Create only (adding charges/collecting payment on a folio, not full billing config)
router.get('/bookings/:id/folio', requirePermission('checkinout'), c.getFolio);
router.post('/bookings/:id/folio/charge', requirePermission('billing', 'create'), c.addCharge);
router.post('/bookings/:id/folio/payment', requirePermission('payments', 'collect'), c.collectPayment);

module.exports = router;