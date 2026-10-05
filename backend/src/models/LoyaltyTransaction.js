const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earned', 'redeemed', 'adjusted'], required: true },
    points: { type: Number, required: true }, // positive for earned, negative for redeemed
    reason: { type: String, required: true }, // "Stay completed — Booking #ab12cd", "Redeemed: Free Room Upgrade"
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    reward: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyReward' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);