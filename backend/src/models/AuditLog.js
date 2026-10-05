const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // WHO
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String, // snapshot, so the log stays readable even if the user is deleted
    userRole: String,

    // WHAT
    action: { type: String, required: true, index: true }, // e.g. ROOM_UPDATED, DOCUMENT_VIEWED
    module: { type: String, default: 'system', index: true }, // rooms, users, documents, billing...
    description: String, // human-readable: "Changed Room 205 price ₹3000 → ₹3500"

    // TARGET
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    targetLabel: String, // e.g. "Room 205"

    // OLD VALUE / NEW VALUE
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    details: mongoose.Schema.Types.Mixed,

    // IP / SESSION
    ipAddress: String,
    sessionId: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } } // WHEN = createdAt
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

// Audit logs are append-only: block edits and deletes made through Mongoose
const blockedOps = ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete', 'deleteOne', 'deleteMany', 'replaceOne'];
blockedOps.forEach((op) => {
  auditLogSchema.pre(op, function (next) {
    next(new Error('Audit logs are immutable and cannot be modified or deleted'));
  });
});

auditLogSchema.pre('save', function () {
  if (!this.isNew) throw new Error('Audit logs are immutable');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);