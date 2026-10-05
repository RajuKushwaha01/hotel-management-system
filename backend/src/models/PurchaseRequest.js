const mongoose = require('mongoose');

const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'converted_to_po'];

const purchaseRequestSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    requestedQuantity: { type: Number, required: true },
    reason: { type: String, default: 'Low stock' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
module.exports.REQUEST_STATUSES = REQUEST_STATUSES;