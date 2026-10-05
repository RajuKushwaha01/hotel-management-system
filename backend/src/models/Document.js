const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    docType: {
      type: String,
      enum: ['guest_id', 'staff_document', 'supplier_document', 'invoice', 'maintenance_document'],
      required: true,
      index: true,
    },
    isSensitive: { type: Boolean, default: false },

    fileName: { type: String, required: true }, // original name, shown to users
    storedName: { type: String, required: true }, // random name on disk, never exposed
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    relatedLabel: { type: String, trim: true, maxlength: 120 }, // e.g. "Guest: Priya Sharma"
    relatedModel: { type: String, enum: ['User', 'Staff', 'Supplier', 'Booking', 'MaintenanceTicket'] },
    relatedId: mongoose.Schema.Types.ObjectId,
    notes: { type: String, maxlength: 500 },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);