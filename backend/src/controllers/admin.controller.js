const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const { logAction, buildChanges } = require('../middleware/auditLogger');

// ---------- DASHBOARD ----------
const getDashboardStats = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalRooms,
      occupiedRooms,
      maintenanceRooms,
      todayCheckIns,
      todayCheckOuts,
      todayBookings,
      monthlyBookings,
      pendingPayments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Room.countDocuments(),
      Booking.countDocuments({ status: 'checked_in' }),
      Room.countDocuments({ status: 'maintenance' }),
      Booking.countDocuments({ checkIn: { $gte: startOfDay,$lte: endOfDay } }),
      Booking.countDocuments({ checkOut: { $gte: startOfDay,$lte: endOfDay } }),
      Booking.countDocuments({ createdAt: { $gte: startOfDay,$lte: endOfDay } }),
      Booking.find({ createdAt: { $gte: startOfMonth }, status: {$ne: 'cancelled' } }),
      Booking.countDocuments({ paymentStatus: { $ne: 'paid' }, status: {$ne: 'cancelled' } }),
    ]);

    const todayRevenue = (
      await Booking.find({ createdAt: { $gte: startOfDay, $lte: endOfDay }, status: {$ne: 'cancelled' } })
    ).reduce((sum, b) => sum + b.totalAmount, 0);

    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms - maintenanceRooms,
        maintenanceRooms,
        todayCheckIns,
        todayCheckOuts,
        todayBookings,
        todayRevenue,
        monthlyRevenue,
        pendingPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- USER MANAGEMENT ----------
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search,$options: 'i' } },
        { lastName: { $regex: search,$options: 'i' } },
        { email: { $regex: search,$options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const createStaffUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(400, 'Email already in use');

    const user = await User.create({ firstName, lastName, email, phone, password, role });

    await logAction({
      action: 'USER_CREATED',
      req,
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.email,
      description: `Created staff user (${role}): ${user.email}`,
      newValue: { firstName, lastName, email, phone, role },
    });

    res.status(201).json({ success: true, message: 'Staff user created', data: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    const before = user.toObject();

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;

    await user.save();

    const { oldValue, newValue, changed } = buildChanges(before, req.body, ['firstName', 'lastName', 'phone', 'role']);
    if (changed) {
      await logAction({
        action: 'USER_UPDATED',
        req,
        targetType: 'User',
        targetId: user._id,
        targetLabel: user.email,
        description: `Updated user ${user.email}`,
        oldValue,
        newValue,
      });
    }

    res.status(200).json({ success: true, message: 'User updated', data: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    const previousStatus = user.isActive;
    user.isActive = !user.isActive;
    await user.save();

    await logAction({
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      req,
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.email,
      description: `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.email}`,
      oldValue: { isActive: previousStatus },
      newValue: { isActive: user.isActive },
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters');
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) throw new ApiError(404, 'User not found');

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    await logAction({
      action: 'PASSWORD_RESET_BY_ADMIN',
      req,
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.email,
      description: `Reset password for user ${user.email}`,
    });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    const userEmail = user.email;
    await user.deleteOne();

    await logAction({
      action: 'USER_DELETED',
      req,
      targetType: 'User',
      targetId: req.params.id,
      targetLabel: userEmail,
      description: `Deleted user ${userEmail}`,
      oldValue: user.toObject(),
    });

    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// ---------- AUDIT LOGS ----------
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const logs = await AuditLog.find()
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments();

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  createStaffUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
  getAuditLogs,
};