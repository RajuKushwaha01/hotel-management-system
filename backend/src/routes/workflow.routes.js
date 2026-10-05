const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/workflow.controller');

const router = express.Router();
router.use(protect, authorize('super_admin', 'hotel_manager'));

router.get('/health', c.getPipelineHealth);
router.get('/trace/:bookingId', c.traceBooking);

module.exports = router;