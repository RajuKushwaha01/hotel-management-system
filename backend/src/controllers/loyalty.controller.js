const User = require('../models/User');
const LoyaltyReward = require('../models/LoyaltyReward');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../middleware/auditLogger');

const LEVEL_THRESHOLDS = [{ level: 'Platinum', min: 20000 }, { level: 'Gold', min: 8000 }, { level: 'Silver', min: 3000 }, { level: 'Bronze', min: 0 }];
const levelFor = (points) => LEVEL_THRESHOLDS.find((t) => points >= t.min).level;

// Called from receptionist.controller.js on checkout — the "earn" side of the loop
const awardPointsForStay = async ({ guestId, bookingId, amountSpent }) => {
  const points = Math.floor(amountSpent / 100); // 1 point per ₹100 spent
  if (points <= 0) return;

  const guest = await User.findById(guestId);
  guest.loyaltyPoints += points;
  guest.membershipLevel = levelFor(guest.loyaltyPoints);
  await guest.save();

  await LoyaltyTransaction.create({ guest: guestId, type: 'earned', points, reason: `Stay completed — Booking #${bookingId.toString().slice(-6)}`, booking: bookingId });
};

// ---------- CUSTOMER-FACING ----------
const getMyLoyalty = async (req, res, next) => {
  try {
    const [rewards, history] = await Promise.all([
      LoyaltyReward.find({ isActive: true }).sort({ pointsCost: 1 }),
      LoyaltyTransaction.find({ guest: req.user._id }).sort({ createdAt: -1 }).limit(30),
    ]);

    const currentIndex = LEVEL_THRESHOLDS.findIndex((t) => t.level === req.user.membershipLevel);
    const nextTier = LEVEL_THRESHOLDS[currentIndex - 1]; // thresholds are ordered highest-first

    res.status(200).json({
      success: true,
      data: {
        points: req.user.loyaltyPoints,
        membershipLevel: req.user.membershipLevel,
        nextTier: nextTier ? { level: nextTier.level, pointsNeeded: nextTier.min - req.user.loyaltyPoints } : null,
        rewards, history,
      },
    });
  } catch (error) { next(error); }
};

const redeemReward = async (req, res, next) => {
  try {
    const reward = await LoyaltyReward.findById(req.params.rewardId);
    if (!reward || !reward.isActive) throw new ApiError(404, 'Reward not found');

    if (req.user.loyaltyPoints < reward.pointsCost) throw new ApiError(400, 'Not enough points for this reward');

    const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    if (tierOrder.indexOf(req.user.membershipLevel) < tierOrder.indexOf(reward.minMembershipLevel)) {
      throw new ApiError(400, `This reward requires ${reward.minMembershipLevel} tier or above`);
    }

    req.user.loyaltyPoints -= reward.pointsCost;
    await req.user.save();

    await LoyaltyTransaction.create({ guest: req.user._id, type: 'redeemed', points: -reward.pointsCost, reason: `Redeemed: ${reward.name}`, reward: reward._id });

    res.status(200).json({ success: true, message: `Redeemed! Show this at the front desk: ${reward.name}`, data: { remainingPoints: req.user.loyaltyPoints } });
  } catch (error) { next(error); }
};

// ---------- ADMIN-SIDE (manage the rewards catalog) ----------
const getRewardsAdmin = async (req, res, next) => {
  try {
    const rewards = await LoyaltyReward.find().sort({ pointsCost: 1 });
    res.status(200).json({ success: true, data: rewards });
  } catch (error) { next(error); }
};

const createReward = async (req, res, next) => {
  try {
    const reward = await LoyaltyReward.create(req.body);
    await logAction({ action: 'LOYALTY_REWARD_CREATED', module: 'settings', req, targetType: 'LoyaltyReward', targetId: reward._id, targetLabel: reward.name, description: `Added reward: ${reward.name}` });
    res.status(201).json({ success: true, message: 'Reward added', data: reward });
  } catch (error) { next(error); }
};

const updateReward = async (req, res, next) => {
  try {
    const reward = await LoyaltyReward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reward) throw new ApiError(404, 'Reward not found');
    res.status(200).json({ success: true, message: 'Reward updated', data: reward });
  } catch (error) { next(error); }
};

module.exports = { awardPointsForStay, getMyLoyalty, redeemReward, getRewardsAdmin, createReward, updateReward };