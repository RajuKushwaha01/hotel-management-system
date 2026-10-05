const mongoose = require('mongoose');

const REQUEST_TYPES = [
  'wake_up_call', 'taxi', 'airport_pickup', 'extra_bed',
  'guest_request', 'complaint',
];

const serviceRequestSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    type: { type: String, enum: REQUEST_TYPES, required: true },
    details: { type: String, required: true }, // e.g. "6:30 AM wake-up", "Airport pickup at 3 PM"
    scheduledTime: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // receptionist who logged it
    resolutionNote: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports.REQUEST_TYPES = REQUEST_TYPES;