const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    currency: { type: String, default: 'INR' },
    taxPercent: { type: Number, default: 12 },
    address: String,
    phone: String,
    email: String,
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in.' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hotel', hotelSchema);