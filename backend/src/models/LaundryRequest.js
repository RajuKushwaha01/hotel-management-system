const mongoose = require('mongoose');

const LAUNDRY_STATUSES = ['requested', 'picked_up', 'processing', 'ready', 'delivered'];
const SERVICE_TYPES = ['wash', 'dry_clean', 'iron_only', 'wash_and_iron'];

const laundryItemSchema = new mongoose.Schema(
  { itemName: { type: String, required: true }, quantity: { type: Number, default: 1 }, pricePerItem: { type: Number, required: true } },
  { _id: false }
);

const laundryRequestSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    roomNumber: String,
    items: [laundryItemSchema],
    serviceType: { type: String, enum: SERVICE_TYPES, default: 'wash_and_iron' },
    totalPrice: { type: Number, default: 0 },
    status: { type: String, enum: LAUNDRY_STATUSES, default: 'requested' },
    requestedAt: { type: Date, default: Date.now },
    pickedUpAt: Date,
    readyAt: Date,
    deliveredAt: Date,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

laundryRequestSchema.methods.calculateTotal = function () {
  this.totalPrice = this.items.reduce((sum, i) => sum + i.quantity * i.pricePerItem, 0);
};

module.exports = mongoose.model('LaundryRequest', laundryRequestSchema);
module.exports.LAUNDRY_STATUSES = LAUNDRY_STATUSES;
module.exports.SERVICE_TYPES = SERVICE_TYPES;