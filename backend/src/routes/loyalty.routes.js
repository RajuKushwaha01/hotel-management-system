const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/loyalty.controller');

const router = express.Router();
router.use(protect);

router.get('/mine', authorize('customer'), c.getMyLoyalty);
router.post('/redeem/:rewardId', authorize('customer'), c.redeemReward);

router.get('/rewards', authorize('hotel_manager', 'super_admin'), c.getRewardsAdmin);
router.post('/rewards', authorize('hotel_manager', 'super_admin'), c.createReward);
router.put('/rewards/:id', authorize('hotel_manager', 'super_admin'), c.updateReward);

module.exports = router;