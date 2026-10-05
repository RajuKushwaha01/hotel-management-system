const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  createServiceRequest, getServiceRequests, updateServiceRequestStatus,
} = require('../controllers/serviceRequest.controller');

const router = express.Router();

router.use(protect, authorize('receptionist', 'hotel_manager', 'super_admin'));

router.get('/', getServiceRequests);
router.post('/', createServiceRequest);
router.patch('/:id', updateServiceRequestStatus);

module.exports = router;