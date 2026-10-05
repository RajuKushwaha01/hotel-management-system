const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    images: [String],
    isPublished: { type: Boolean, default: true },

    // Manager response workflow
    managerResponse: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);