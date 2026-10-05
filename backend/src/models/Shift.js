const mongoose = require('mongoose');

const SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night'];

const SHIFT_TIMES = {
  morning: { start: '06:00', end: '14:00' },
  afternoon: { start: '14:00', end: '22:00' },
  evening: { start: '16:00', end: '00:00' },
  night: { start: '22:00', end: '06:00' },
};

const shiftSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shiftType: { type: String, enum: SHIFT_TYPES, required: true },
    date: { type: Date, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

shiftSchema.index({ staff: 1, date: 1 }, { unique: true }); // one shift per staff per day

module.exports = mongoose.model('Shift', shiftSchema);
module.exports.SHIFT_TYPES = SHIFT_TYPES;
module.exports.SHIFT_TIMES = SHIFT_TIMES;