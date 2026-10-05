const User = require('../models/User');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const { limitGuestFields } = require('../middleware/permission.middleware');

// ---------- CREATE GUEST ----------
const createGuest = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      idType,
      idNumber,
      preferences,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(400, 'A guest with this email already exists');

    const tempPassword = Math.random().toString(36).slice(-10);
    const guest = await User.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      idType,
      idNumber,
      preferences,
      password: tempPassword,
      role: 'customer',
      isWalkIn: true,
    });

    res
      .status(201)
      .json({ success: true, message: 'Guest profile created', data: guest.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// ---------- UPDATE GUEST ----------
const updateGuest = async (req, res, next) => {
  try {
    const allowed = [
      'firstName',
      'lastName',
      'phone',
      'address',
      'dateOfBirth',
      'idType',
      'idNumber',
      'preferences',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const guest = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer' },
      updates,
      { new: true }
    );
    if (!guest) throw new ApiError(404, 'Guest not found');

    res
      .status(200)
      .json({ success: true, message: 'Guest profile updated', data: guest.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// ---------- SEARCH GUESTS ----------
const searchGuests = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));

    const filter = { role: 'customer' };

    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ];
    }

    const guests = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    const guestList = guests.map((g) => limitGuestFields(g.toSafeObject(), req.permissionLevel));

    res.status(200).json({
      success: true,
      data: guestList,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- GET GUEST PROFILE ----------
const getGuestProfile = async (req, res, next) => {
  try {
    const guest = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!guest) throw new ApiError(404, 'Guest not found');

    const guestData = limitGuestFields(guest.toSafeObject(), req.permissionLevel);
    res.status(200).json({ success: true, data: guestData });
  } catch (error) {
    next(error);
  }
};

// ---------- GET GUEST HISTORY ----------
const getGuestHistory = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ guest: req.params.id })
      .populate('room', 'roomNumber roomType')
      .sort({ createdAt: -1 });

    // FIXED: Aligned obsolete 'completed' enum to 'checked_out'
    const totalStays = bookings.filter((b) => b.status === 'checked_out').length;
    const totalSpent = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        summary: {
          totalStays,
          totalSpent,
          totalBookings: bookings.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGuest,
  updateGuest,
  searchGuests,
  getGuestProfile,
  getGuestHistory,
};