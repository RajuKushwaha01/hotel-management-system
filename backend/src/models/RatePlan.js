const mongoose = require('mongoose');

// Date-bound special rate rules: seasonal, holiday, corporate, promotional
const ratePlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Diwali Festival Rate", "Acme Corp Rate"
    type: { type: String, enum: ['seasonal', 'holiday', 'corporate', 'promotional'], required: true },
    roomType: {
      type: String,
      enum: ['single', 'double', 'twin', 'deluxe', 'suite', 'family', 'executive', 'presidential'],
      required: true,
    },
    rate: { type: Number, required: true },
    startDate: Date, // required for seasonal/holiday/promotional
    endDate: Date,
    promoCode: String, // required for promotional
    companyName: String, // required for corporate
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RatePlan', ratePlanSchema);