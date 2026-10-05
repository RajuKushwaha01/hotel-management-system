const mongoose = require('mongoose');

const KOT_STATUSES = ['new', 'accepted', 'preparing', 'ready', 'served', 'cancelled'];
const ORDER_TYPES = ['dine_in', 'room_service'];

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: String, // snapshot at order time
    price: Number,
    quantity: { type: Number, default: 1 },
    notes: String,
    cancelled: { type: Boolean, default: false },
    cancelReason: String,
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderType: { type: String, enum: ORDER_TYPES, default: 'dine_in' },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // for room service, links to guest stay
    roomNumber: String,
    items: [orderItemSchema],
    status: { type: String, enum: KOT_STATUSES, default: 'new' },
    priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'charged_to_room'], default: 'unpaid' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelReason: String,
    servedAt: Date,
  },
  { timestamps: true }
);

orderSchema.methods.calculateTotals = function () {
  const activeItems = this.items.filter((i) => !i.cancelled);
  this.subtotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  this.tax = Math.round(this.subtotal * 0.05);
  this.total = this.subtotal + this.tax + this.serviceCharge - this.discount;
};

module.exports = mongoose.model('Order', orderSchema);
module.exports.KOT_STATUSES = KOT_STATUSES;
module.exports.ORDER_TYPES = ORDER_TYPES;