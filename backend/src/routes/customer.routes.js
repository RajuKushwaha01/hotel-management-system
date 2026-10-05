const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/customer.controller');

const router = express.Router();
router.use(protect, authorize('customer'));

router.get('/dashboard', c.getDashboard);

router.get('/availability', c.checkAvailability);
router.post('/bookings', c.createBooking);
router.get('/bookings', c.getMyBookings);
router.patch('/bookings/:id/cancel', c.cancelMyBooking);
router.put('/bookings/:id', c.modifyMyBooking);

router.get('/invoices/:bookingId', c.getMyInvoice);

router.post('/service-requests', c.createMyServiceRequest);
router.get('/service-requests', c.getMyServiceRequests);

router.post('/complaints', c.createComplaint);
router.get('/complaints', c.getMyComplaints);

router.post('/reviews', c.createReview);
router.get('/reviews', c.getMyReviews);
router.put('/reviews/:id', c.updateReview);
router.delete('/reviews/:id', c.deleteReview);

router.put('/profile', c.updateMyProfile);

module.exports = router;