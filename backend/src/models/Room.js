const mongoose = require('mongoose');

const ROOM_TYPES = [
  'single', 'double', 'twin', 'deluxe', 'suite', 'family', 'executive', 'presidential',
];

const ROOM_STATUSES = [
  'available', 'reserved', 'occupied', 'dirty', 'cleaning',
  'inspection', 'maintenance', 'out_of_order', 'blocked',
];

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    floor: { type: Number, required: true },
    roomType: { type: String, enum: ROOM_TYPES, required: true },
    capacity: { type: Number, default: 2 },
    bedType: { type: String, default: 'King' },
    pricePerNight: { type: Number, required: true }, // base/standard rate fallback
    sizeSqm: Number,
    amenities: [String],
    images: [String],
    description: String,
    status: { type: String, enum: ROOM_STATUSES, default: 'available' },
    isBookable: { type: Boolean, default: true },
    blockedReason: String, // set when status = 'blocked'
    blockedUntil: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
module.exports.ROOM_TYPES = ROOM_TYPES;
module.exports.ROOM_STATUSES = ROOM_STATUSES;