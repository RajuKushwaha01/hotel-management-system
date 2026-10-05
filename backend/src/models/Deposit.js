const mongoose = require('mongoose');

const DEPOSIT_TYPES = ['booking_advance', 'security_deposit', 'partial_payment', 'full_payment'];
const REFUND_STATUSES = ['not_applicable', 'requested', 'approved', 'processed', 'rejected'];

const depositSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: DEPOSIT_TYPES, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer'], default: 'cash' },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Refund tracking
    refundStatus: { type: String, enum: REFUND_STATUSES, default: 'not_applicable' },
    refundAmount: { type: Number, default: 0 },
    refundReason: String,
    cancellationFee: { type: Number, default: 0 },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refundedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deposit', depositSchema);
module.exports.DEPOSIT_TYPES = DEPOSIT_TYPES;
module.exports.REFUND_STATUSES = REFUND_STATUSES;