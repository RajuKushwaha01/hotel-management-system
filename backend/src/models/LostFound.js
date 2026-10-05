const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema(
  {
    itemDescription: { type: String, required: true },
    photo: String, // Cloudinary URL
    foundLocation: { type: String, required: true },
    foundDate: { type: Date, default: Date.now },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestAssociation: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional link to a guest
    status: { type: String, enum: ['stored', 'claimed', 'disposed'], default: 'stored' },
    handoverRecord: {
      handedToName: String,
      handedOverAt: Date,
      handedOverBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LostFound', lostFoundSchema);