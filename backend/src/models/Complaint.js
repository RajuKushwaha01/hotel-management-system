const mongoose = require('mongoose');

const COMPLAINT_STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];

const complaintSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: COMPLAINT_STATUSES, default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    response: String,
    respondedAt: Date,
    resolutionNote: String,
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
module.exports.COMPLAINT_STATUSES = COMPLAINT_STATUSES;