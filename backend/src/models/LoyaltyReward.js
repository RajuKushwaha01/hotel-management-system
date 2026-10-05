const mongoose = require('mongoose');

const loyaltyRewardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Free Room Upgrade", "10% Off Next Stay", "Complimentary Breakfast"
    description: String,
    pointsCost: { type: Number, required: true },
    minMembershipLevel: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoyaltyReward', loyaltyRewardSchema);