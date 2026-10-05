const mongoose = require('mongoose');

const CHARGE_TYPES = [
  'room', 'restaurant', 'room_service', 'laundry', 'extra_bed',
  'transport', 'event', 'misc', 'tax', 'discount',
];

const chargeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: CHARGE_TYPES, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true }, // negative for discounts
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer'], default: 'cash' },
    note: String,
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const folioSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    charges: [chargeSchema],
    payments: [paymentSchema],
    taxPercent: { type: Number, default: 12 },
    verificationCode: { type: String, unique: true, sparse: true },
    isClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Returns a full category breakdown, exactly matching the guest folio formula:
// Room + Restaurant + Room Service + Laundry + Extra Bed + Transport + Other
// + Taxes - Discounts - Payments = Outstanding Balance
folioSchema.methods.getBreakdown = function () {
  const byCategory = {};
  CHARGE_TYPES.forEach((t) => (byCategory[t] = 0));

  this.charges.forEach((c) => {
    byCategory[c.type] = (byCategory[c.type] || 0) + c.amount;
  });

  const subtotal =
    byCategory.room + byCategory.restaurant + byCategory.room_service +
    byCategory.laundry + byCategory.extra_bed + byCategory.transport +
    byCategory.event + byCategory.misc;

  const tax = byCategory.tax || Math.round(subtotal * (this.taxPercent / 100));
  const discount = Math.abs(byCategory.discount || 0);
  const totalCharges = subtotal + tax - discount;
  const totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    byCategory,
    subtotal,
    tax,
    discount,
    totalCharges,
    totalPaid,
    balance: totalCharges - totalPaid,
  };
};

// Kept for backward compatibility with earlier controllers using getTotals()
folioSchema.methods.getTotals = function () {
  const b = this.getBreakdown();
  return { totalCharges: b.totalCharges, totalPaid: b.totalPaid, balance: b.balance };
};

module.exports = mongoose.model('Folio', folioSchema);
module.exports.CHARGE_TYPES = CHARGE_TYPES;