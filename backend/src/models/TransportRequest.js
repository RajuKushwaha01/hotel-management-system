const mongoose = require('mongoose');

const TRANSPORT_TYPES = ['airport_pickup', 'airport_drop', 'taxi', 'hotel_vehicle'];
const TRANSPORT_STATUSES = ['requested', 'assigned', 'en_route', 'completed', 'cancelled'];

const transportRequestSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    type: { type: String, enum: TRANSPORT_TYPES, required: true },
    vehicle: String, // e.g. "Toyota Innova - KA01AB1234"
    driverName: String,
    driverPhone: String,
    scheduledDateTime: { type: Date, required: true },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    cost: { type: Number, default: 0 },
    status: { type: String, enum: TRANSPORT_STATUSES, default: 'requested' },
    chargeToFolio: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportRequest', transportRequestSchema);
module.exports.TRANSPORT_TYPES = TRANSPORT_TYPES;
module.exports.TRANSPORT_STATUSES = TRANSPORT_STATUSES;