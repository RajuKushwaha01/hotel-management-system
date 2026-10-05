const Booking = require('../models/Booking');
const Room = require('../models/Room');
const ApiError = require('../utils/ApiError');

// ---------- DASHBOARD ----------
const getManagerDashboard = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      arrivals,
      departures,
      totalRooms,
      occupied,
      maintenance,
      pendingPayments,
      totalBookingsToday,
    ] = await Promise.all([
      Booking.find({ checkIn: { $gte: startOfDay, $lte: endOfDay }, status: { $in: ['confirmed', 'pending'] } })
        .populate('guest', 'firstName lastName')
        .populate('room', 'roomNumber roomType'),
      Booking.find({ checkOut: { $gte: startOfDay, $lte: endOfDay }, status: 'checked_in' })
        .populate('guest', 'firstName lastName')
        .populate('room', 'roomNumber roomType'),
      Room.countDocuments(),
      Room.countDocuments({ status: { $in: ['dirty', 'cleaning'] } }),
      Room.countDocuments({ status: 'maintenance' }),
      Booking.countDocuments({ paymentStatus: { $ne: 'paid' }, status: { $ne: 'cancelled' } }),
      Booking.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
    ]);

    const todayRevenue = (
      await Booking.find({ createdAt: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: 'cancelled' } })
    ).reduce((sum, b) => sum + b.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        arrivalsToday: arrivals.length,
        departuresToday: departures.length,
        arrivals,
        departures,
        occupancyRate: totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
        availableRooms: totalRooms - occupied - maintenance,
        maintenanceRooms: maintenance,
        pendingPayments,
        totalBookingsToday,
        todayRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- RESERVATIONS OVERSIGHT ----------
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};

    const bookings = await Booking.find(filter)
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber roomType pricePerNight')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    booking.status = 'confirmed';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking approved', data: booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    next(error);
  }
};

const reassignRoom = async (req, res, next) => {
  try {
    const { roomId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    const room = await Room.findById(roomId);
    if (!room) throw new ApiError(404, 'Room not found');
    if (!room.isBookable) throw new ApiError(400, 'Selected room is not bookable');

    booking.room = roomId;
    await booking.save();

    res.status(200).json({ success: true, message: 'Room reassigned', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManagerDashboard,
  getAllBookings,
  approveBooking,
  cancelBooking,
  reassignRoom,
};