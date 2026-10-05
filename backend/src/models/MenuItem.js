const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // Starters, Main Course, Desserts, Beverages
    price: { type: Number, required: true },
    taxPercent: { type: Number, default: 5 },
    image: String,
    description: String,
    isVeg: { type: Boolean, default: true },
    isSpecial: { type: Boolean, default: false },
    recipe: [{ item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' }, quantityPerServing: Number }],
    availability: {
      type: String,
      enum: ['available', 'low_stock', 'temporarily_unavailable', 'out_of_stock'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);