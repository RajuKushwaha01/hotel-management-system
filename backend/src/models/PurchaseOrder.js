const mongoose = require('mongoose');

const PO_STATUSES = ['created', 'sent_to_supplier', 'goods_received', 'closed', 'cancelled'];

const poItemSchema = new mongoose.Schema(
  { item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true }, quantity: { type: Number, required: true }, unitCost: { type: Number, required: true } },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseRequest' },
    items: [poItemSchema],
    totalCost: { type: Number, default: 0 },
    status: { type: String, enum: PO_STATUSES, default: 'created' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    goodsReceivedAt: Date,
    goodsReceivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

purchaseOrderSchema.methods.calculateTotal = function () {
  this.totalCost = this.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
module.exports.PO_STATUSES = PO_STATUSES;