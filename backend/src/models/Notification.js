const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  // Customer
  'booking_confirmed', 'payment_successful', 'cancellation', 'checkin_reminder', 'checkout_reminder', 'invoice_generated',
  // Staff
  'new_booking', 'new_kot', 'cleaning_assignment', 'maintenance_request', 'low_inventory', 'complaint',
  // Manager
  'low_occupancy', 'high_cancellation', 'high_priority_complaint', 'maintenance_issue', 'low_stock', 'pending_payment',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String, // frontend route to navigate to when clicked, e.g. "/receptionist/reservations"
    state: { type: String, enum: ['unread', 'read', 'archived'], default: 'unread' },
    relatedId: mongoose.Schema.Types.ObjectId, // booking/order/ticket id etc.
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, state: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;