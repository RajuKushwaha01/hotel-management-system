const mongoose = require('mongoose');

const EVENT_TYPES = ['wedding', 'meeting', 'party', 'corporate_event', 'conference'];
const EVENT_STATUSES = ['inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const eventBookingSchema = new mongoose.Schema(
  {
    hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    eventName: { type: String, required: true },
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    clientEmail: String,
    eventDate: { type: Date, required: true },
    startTime: String, // "14:00"
    endTime: String,   // "22:00"
    guestCount: { type: Number, required: true },
    catering: { requested: { type: Boolean, default: false }, menuNotes: String, costPerPlate: Number },
    decoration: { requested: { type: Boolean, default: false }, theme: String, cost: Number },
    equipment: [{ name: String, cost: Number }], // projector, mic, extra chairs
    hallCost: { type: Number, required: true },
    totalCost: { type: Number, default: 0 },
    advancePayment: { type: Number, default: 0 },
    status: { type: String, enum: EVENT_STATUSES, default: 'inquiry' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

eventBookingSchema.methods.calculateTotal = function () {
  const cateringCost = this.catering.requested ? (this.catering.costPerPlate || 0) * this.guestCount : 0;
  const decorationCost = this.decoration.requested ? (this.decoration.cost || 0) : 0;
  const equipmentCost = this.equipment.reduce((sum, e) => sum + (e.cost || 0), 0);
  this.totalCost = this.hallCost + cateringCost + decorationCost + equipmentCost;
};

module.exports = mongoose.model('EventBooking', eventBookingSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports.EVENT_STATUSES = EVENT_STATUSES;