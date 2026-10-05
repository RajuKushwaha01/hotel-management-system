const mongoose = require('mongoose');

const DEPARTMENTS = ['housekeeping', 'kitchen', 'maintenance'];

const CATEGORY_MAP = {
  housekeeping: ['Towels', 'Sheets', 'Soap', 'Shampoo', 'Pillows', 'Cleaning Materials'],
  kitchen: ['Rice', 'Vegetables', 'Meat', 'Oil', 'Drinks', 'Dairy', 'Spices'],
  maintenance: ['Bulbs', 'Wires', 'Pipes', 'Spare Parts', 'Tools'],
};

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    category: { type: String, required: true },
    unit: { type: String, default: 'pcs' }, // kg, boxes, pcs, liters, meters
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 10 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    costPerUnit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

inventoryItemSchema.virtual('status').get(function () {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minimumStock) return 'low_stock';
  return 'in_stock';
});
inventoryItemSchema.set('toJSON', { virtuals: true });
inventoryItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
module.exports.DEPARTMENTS = DEPARTMENTS;
module.exports.CATEGORY_MAP = CATEGORY_MAP;