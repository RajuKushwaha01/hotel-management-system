const mongoose = require('mongoose');

const CATEGORIES = [
  'ac', 'electrical', 'plumbing', 'wifi', 'tv', 'furniture',
  'bathroom', 'elevator', 'generator', 'water', 'appliances',
];
const STATUSES = ['open', 'assigned', 'in_progress', 'completed', 'verified', 'closed'];

const maintenanceTicketSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    status: { type: String, enum: STATUSES, default: 'open' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    photos: [String], // Cloudinary URLs
    repairNotes: String,
    partsUsed: [{ item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' }, name: String, quantity: Number, cost: Number }],
    totalCost: { type: Number, default: 0 },
    completedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;