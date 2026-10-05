const mongoose = require('mongoose');

const TASK_STATUSES = ['pending', 'accepted', 'cleaning', 'inspection', 'clean'];

const housekeepingTaskSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: TASK_STATUSES, default: 'pending' },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    startedAt: Date,
    completedAt: Date,
    inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inspectedAt: Date,
    damageReport: { description: String, reportedAt: Date },
    missingItems: [{ itemName: String, quantity: Number, reportedAt: Date }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('HousekeepingTask', housekeepingTaskSchema);
module.exports.TASK_STATUSES = TASK_STATUSES;