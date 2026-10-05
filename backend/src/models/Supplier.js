const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: String,
    phone: { type: String, required: true },
    email: String,
    address: String,
    productsSupplied: [String], // e.g. ["Rice", "Vegetables", "Oil"]
    paymentTerms: { type: String, enum: ['cash_on_delivery', 'net_15', 'net_30', 'net_45', 'advance'], default: 'net_30' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);