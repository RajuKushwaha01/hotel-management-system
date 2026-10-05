const mongoose = require('mongoose');

// Per-room-type charge extras (extra guest, extra bed, child charge)
const roomRateSchema = new mongoose.Schema(
  {
    roomType: {
      type: String,
      enum: ['single', 'double', 'twin', 'deluxe', 'suite', 'family', 'executive', 'presidential'],
      required: true,
      unique: true,
    },
    standardRate: { type: Number, required: true },
    weekendRate: { type: Number, required: true },
    extraGuestCharge: { type: Number, default: 500 },
    extraBedCharge: { type: Number, default: 800 },
    childCharge: { type: Number, default: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomRate', roomRateSchema);