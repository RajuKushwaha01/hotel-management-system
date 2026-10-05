const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['stock_in', 'stock_out', 'wastage', 'adjustment'];

const stockTransactionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    quantity: { type: Number, required: true }, // always positive; direction is determined by type
    reason: String, // e.g. "Purchase order #123 received", "Spoiled vegetables", "Used in Room 204 cleaning"
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    balanceAfter: Number, // snapshot of currentStock after this transaction
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;