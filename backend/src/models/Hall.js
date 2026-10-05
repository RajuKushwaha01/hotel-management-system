const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Grand Ballroom", "Conference Room A"
    type: { type: String, enum: ['conference_room', 'banquet_hall', 'meeting_room'], required: true },
    capacity: { type: Number, required: true },
    pricePerHour: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    amenities: [String], // Projector, Sound System, Stage, AC
    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hall', hallSchema);