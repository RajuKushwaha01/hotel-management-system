const mongoose = require('mongoose');

const backupLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['manual', 'scheduled'], default: 'manual' },
    status: { type: String, enum: ['completed', 'failed'], default: 'completed' },
    collections: [String],
    sizeBytes: Number,
    fileName: String,
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('BackupLog', backupLogSchema);