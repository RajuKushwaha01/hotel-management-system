const mongoose = require('mongoose');

const LEAVE_STATUSES = ['pending', 'approved', 'rejected'];
const LEAVE_TYPES = ['sick', 'casual', 'earned', 'emergency', 'unpaid'];

const leaveRequestSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: LEAVE_STATUSES, default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
module.exports.LEAVE_STATUSES = LEAVE_STATUSES;
module.exports.LEAVE_TYPES = LEAVE_TYPES;