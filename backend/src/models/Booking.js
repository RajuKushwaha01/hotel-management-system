const mongoose = require('mongoose');

const BOOKING_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
const BOOKING_SOURCES = ['website', 'walk_in', 'phone', 'reception', 'corporate', 'travel_agency', 'booking_platform'];

const bookingSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    additionalGuests: [{ name: String, age: Number }],

    // Multi-room / group booking support
    rooms: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
        rateApplied: Number, // snapshot of the rate used for this room at booking time
      },
    ],
    // Kept for backward compatibility with single-room flows already built
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },

    roomHistory: [{ room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, changedAt: { type: Date, default: Date.now }, reason: String }],

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    originalCheckOut: Date,
    guests: { type: Number, default: 1 },

    source: { type: String, enum: BOOKING_SOURCES, default: 'website' },
    rateType: { type: String, enum: ['standard', 'weekend', 'seasonal', 'holiday', 'corporate', 'promotional'], default: 'standard' },

    totalAmount: { type: Number, required: true },
    advanceCollected: { type: Number, default: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid', 'refunded', 'partially_refunded'], default: 'unpaid' },

    specialRequests: String,
    actualCheckInTime: Date,
    actualCheckOutTime: Date,

    rescheduleHistory: [{ oldCheckIn: Date, oldCheckOut: Date, newCheckIn: Date, newCheckOut: Date, reason: String, changedAt: { type: Date, default: Date.now } }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    groupBookingId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
module.exports.BOOKING_SOURCES = BOOKING_SOURCES;