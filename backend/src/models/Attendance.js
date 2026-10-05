const mongoose = require('mongoose');

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'leave', 'half_day'];

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
    checkInTime: Date,
    checkOutTime: Date,
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    notes: String,
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

attendanceSchema.index({ staff: 1, date: 1 }, { unique: true }); // one attendance record per staff per day

module.exports = mongoose.model('Attendance', attendanceSchema);
module.exports.ATTENDANCE_STATUSES = ATTENDANCE_STATUSES;