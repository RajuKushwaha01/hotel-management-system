const Attendance = require('../models/Attendance');
const Shift = require('../models/Shift');
const LeaveRequest = require('../models/LeaveRequest');
const ApiError = require('../utils/ApiError');
const { scopeToOwn } = require('../middleware/permission.middleware');

// ---------- SHIFTS ----------
const assignShift = async (req, res, next) => {
  try {
    const { staffId, shiftType, date } = req.body;

    const shift = await Shift.findOneAndUpdate(
      { staff: staffId, date: new Date(date) },
      { shiftType, assignedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Shift assigned', data: shift });
  } catch (error) {
    next(error);
  }
};

const getShifts = async (req, res, next) => {
  try {
    const { staffId, from, to } = req.query;
    let filter = {};
    if (staffId && req.permissionLevel === 'manage') filter.staff = staffId;
    if (from && to) filter.date = { $gte: new Date(from),$lte: new Date(to) };
    filter = scopeToOwn(req, filter);

    const shifts = await Shift.find(filter).populate('staff', 'firstName lastName role').sort({ date: 1 });
    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    next(error);
  }
};

const deleteShift = async (req, res, next) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Shift removed' });
  } catch (error) {
    next(error);
  }
};

// ---------- ATTENDANCE ----------
const markAttendance = async (req, res, next) => {
  try {
    const { staffId, date, status, checkInTime, checkOutTime, notes } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { staff: staffId, date: new Date(date) },
      { status, checkInTime, checkOutTime, notes, markedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Attendance marked', data: attendance });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { staffId, from, to, status } = req.query;
    let filter = {};
    if (staffId && req.permissionLevel === 'manage') filter.staff = staffId;
    if (status) filter.status = status;
    if (from && to) filter.date = { $gte: new Date(from),$lte: new Date(to) };
    filter = scopeToOwn(req, filter);

    const records = await Attendance.find(filter).populate('staff', 'firstName lastName role').sort({ date: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// Attendance report: per-staff summary counts over a date range
const getAttendanceReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from && to) filter.date = { $gte: new Date(from),$lte: new Date(to) };

    const records = await Attendance.find(filter).populate('staff', 'firstName lastName role');

    const summary = {};
    records.forEach((r) => {
      const key = r.staff._id.toString();
      if (!summary[key]) {
        summary[key] = { staff: { _id: r.staff._id, name: `${r.staff.firstName} ${r.staff.lastName}`, role: r.staff.role }, present: 0, absent: 0, late: 0, leave: 0, half_day: 0 };
      }
      summary[key][r.status] += 1;
    });

    res.status(200).json({ success: true, data: Object.values(summary) });
  } catch (error) {
    next(error);
  }
};

// ---------- LEAVE REQUESTS ----------
const createLeaveRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const request = await LeaveRequest.create({ staff: req.user._id, leaveType, startDate, endDate, reason });
    res.status(201).json({ success: true, message: 'Leave request submitted', data: request });
  } catch (error) {
    next(error);
  }
};

const getLeaveRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;
    filter = scopeToOwn(req, filter);

    const requests = await LeaveRequest.find(filter)
      .populate('staff', 'firstName lastName role')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) throw new ApiError(404, 'Leave request not found');

    request.status = 'approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    // Auto-mark attendance as 'leave' for each day in the range
    const days = [];
    for (let d = new Date(request.startDate); d <= new Date(request.endDate); d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    await Promise.all(
      days.map((day) =>
        Attendance.findOneAndUpdate(
          { staff: request.staff, date: day },
          { status: 'leave', markedBy: req.user._id },
          { upsert: true }
        )
      )
    );

    res.status(200).json({ success: true, message: 'Leave approved', data: request });
  } catch (error) {
    next(error);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const request = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!request) throw new ApiError(404, 'Leave request not found');

    res.status(200).json({ success: true, message: 'Leave rejected', data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignShift, getShifts, deleteShift,
  markAttendance, getAttendance, getAttendanceReport,
  createLeaveRequest, getLeaveRequests, approveLeave, rejectLeave,
};