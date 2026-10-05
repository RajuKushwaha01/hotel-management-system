const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/reviewComplaint.controller');

const router = express.Router();
router.use(protect, authorize('hotel_manager', 'super_admin', 'receptionist'));

router.get('/reviews', c.getAllReviews);
router.patch('/reviews/:id/respond', c.respondToReview);
router.patch('/reviews/:id/toggle-publish', c.togglePublishReview);

router.get('/complaints', c.getAllComplaints);
router.patch('/complaints/:id/assign', c.assignComplaint);
router.patch('/complaints/:id/respond', c.respondToComplaint);
router.patch('/complaints/:id/resolve', c.resolveComplaint);
router.patch('/complaints/:id/close', c.closeComplaint);

module.exports = router;