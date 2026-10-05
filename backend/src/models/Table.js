const mongoose = require('mongoose');

const TABLE_STATUSES = ['available', 'occupied', 'reserved', 'cleaning'];

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    status: { type: String, enum: TABLE_STATUSES, default: 'available' },
    mergedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table' }], // tables merged into this one
    isMergedChild: { type: Boolean, default: false }, // true if merged into another table, hidden from layout
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
module.exports.TABLE_STATUSES = TABLE_STATUSES;