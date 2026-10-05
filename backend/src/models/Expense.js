const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'electricity', 'water', 'salary', 'food', 'cleaning',
  'maintenance', 'internet', 'supplies', 'other',
];

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiptImage: String, // Cloudinary URL
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;