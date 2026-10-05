const NightAudit = require('../models/NightAudit');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Folio = require('../models/Folio');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

// Step 1-3: Run all the checks without closing the day yet — lets the accountant/manager review first
const runChecks = async (req, res, next) => {
  try {
    const { businessDate } = req.query;
    const date = businessDate ? new Date(businessDate) : new Date();
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const existing = await NightAudit.findOne({ businessDate: dayStart });
    if (existing && existing.status === 'completed') {
      throw new ApiError(400, 'This business day has already been closed');
    }

    // --- Check open bookings (should be confirmed/checked_in, none stuck in pending past today) ---
    const openBookings = await Booking.find({ status: 'pending', checkIn: { $lte: dayEnd } });

    // --- Check unpaid folios ---
    const allFolios = await Folio.find({ isClosed: false });
    const unpaidFolios = allFolios.filter((f) => f.getBreakdown().balance > 0);
    const unpaidAmount = unpaidFolios.reduce((sum, f) => sum + f.getBreakdown().balance, 0);

    // --- Check room status consistency (occupied rooms should have a checked_in booking) ---
    const checkedInBookings = await Booking.find({ status: 'checked_in' }).populate('room');
    const occupiedRoomIds = new Set(checkedInBookings.map((b) => b.room?._id?.toString()));
    const allRooms = await Room.find();
    const roomStatusIssues = allRooms
      .filter((r) => (r.status === 'occupied') !== occupiedRoomIds.has(r._id.toString()))
      .map((r) => ({ room: r.roomNumber, status: r.status, expected: occupiedRoomIds.has(r._id.toString()) ? 'occupied' : 'not occupied' }));

    // --- Calculate revenue ---
    const bookingsToday = await Booking.find({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $ne: 'cancelled' } });
    const ordersToday = await Order.find({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $ne: 'cancelled' } });
    const roomRevenue = bookingsToday.reduce((s, b) => s + b.totalAmount, 0);
    const restaurantRevenue = ordersToday.reduce((s, o) => s + o.total, 0);
    const totalRevenue = roomRevenue + restaurantRevenue;

    // --- Calculate taxes across today's folios ---
    let taxCollected = 0;
    allFolios.forEach((f) => { taxCollected += f.getBreakdown().tax; });

    // --- Occupancy ---
    const occupiedRooms = allRooms.filter((r) => r.status === 'occupied' || r.status === 'reserved').length;
    const occupancyRate = allRooms.length ? ((occupiedRooms / allRooms.length) * 100).toFixed(1) : 0;

    // --- Arrivals / departures / no-shows for the day ---
    const arrivals = await Booking.countDocuments({ checkIn: { $gte: dayStart, $lte: dayEnd } });
    const departures = await Booking.countDocuments({ checkOut: { $gte: dayStart, $lte: dayEnd } });
    const noShows = await Booking.countDocuments({ checkIn: { $gte: dayStart, $lte: dayEnd }, status: 'no_show' });

    const checkResult = {
      businessDate: dayStart,
      openBookingsCount: openBookings.length,
      openBookings,
      unpaidFoliosCount: unpaidFolios.length,
      unpaidFoliosAmount: unpaidAmount,
      unpaidFolios,
      roomStatusIssues,
      roomRevenue,
      restaurantRevenue,
      totalRevenue,
      taxCollected: Math.round(taxCollected),
      occupiedRooms,
      totalRooms: allRooms.length,
      occupancyRate: Number(occupancyRate),
      arrivals,
      departures,
      noShows,
      canClose: openBookings.length === 0 && roomStatusIssues.length === 0,
    };

    res.status(200).json({ success: true, data: checkResult });
  } catch (error) {
    next(error);
  }
};

// Step 4-6: Close the business day — persists the audit record permanently
const closeBusinessDay = async (req, res, next) => {
  try {
    const { businessDate, notes, forceClose } = req.body;
    const date = businessDate ? new Date(businessDate) : new Date();
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const existing = await NightAudit.findOne({ businessDate: dayStart });
    if (existing && existing.status === 'completed') {
      throw new ApiError(400, 'This business day has already been closed');
    }

    const openBookings = await Booking.find({ status: 'pending', checkIn: { $lte: dayEnd } });
    const allRooms = await Room.find();
    const checkedInBookings = await Booking.find({ status: 'checked_in' }).populate('room');
    const occupiedRoomIds = new Set(checkedInBookings.map((b) => b.room?._id?.toString()));
    const roomStatusIssues = allRooms
      .filter((r) => (r.status === 'occupied') !== occupiedRoomIds.has(r._id.toString()))
      .map((r) => ({ room: r.roomNumber, status: r.status, expected: occupiedRoomIds.has(r._id.toString()) ? 'occupied' : 'not occupied' }));

    if (!forceClose && (openBookings.length > 0 || roomStatusIssues.length > 0)) {
      throw new ApiError(400, 'Unresolved issues found (open bookings or room status mismatches). Resolve them or pass forceClose to override.');
    }

    const allFolios = await Folio.find({ isClosed: false });
    const unpaidFolios = allFolios.filter((f) => f.getBreakdown().balance > 0);
    const unpaidAmount = unpaidFolios.reduce((sum, f) => sum + f.getBreakdown().balance, 0);

    const bookingsToday = await Booking.find({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $ne: 'cancelled' } });
    const ordersToday = await Order.find({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $ne: 'cancelled' } });
    const roomRevenue = bookingsToday.reduce((s, b) => s + b.totalAmount, 0);
    const restaurantRevenue = ordersToday.reduce((s, o) => s + o.total, 0);

    let taxCollected = 0;
    allFolios.forEach((f) => { taxCollected += f.getBreakdown().tax; });

    const occupiedRooms = allRooms.filter((r) => r.status === 'occupied' || r.status === 'reserved').length;
    const occupancyRate = allRooms.length ? ((occupiedRooms / allRooms.length) * 100).toFixed(1) : 0;

    const arrivals = await Booking.countDocuments({ checkIn: { $gte: dayStart, $lte: dayEnd } });
    const departures = await Booking.countDocuments({ checkOut: { $gte: dayStart, $lte: dayEnd } });
    const noShows = await Booking.countDocuments({ checkIn: { $gte: dayStart, $lte: dayEnd }, status: 'no_show' });

    const audit = await NightAudit.findOneAndUpdate(
      { businessDate: dayStart },
      {
        openBookingsCount: openBookings.length,
        unpaidFoliosCount: unpaidFolios.length,
        unpaidFoliosAmount: unpaidAmount,
        roomStatusIssues,
        roomRevenue,
        restaurantRevenue,
        totalRevenue: roomRevenue + restaurantRevenue,
        taxCollected: Math.round(taxCollected),
        occupiedRooms,
        totalRooms: allRooms.length,
        occupancyRate: Number(occupancyRate),
        arrivals,
        departures,
        noShows,
        status: 'completed',
        runBy: req.user._id,
        closedAt: new Date(),
        notes,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: 'Business day closed successfully', data: audit });
  } catch (error) {
    next(error);
  }
};

const getAuditHistory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { status: 'completed' };
    if (from && to) filter.businessDate = { $gte: new Date(from), $lte: new Date(to) };

    const audits = await NightAudit.find(filter).populate('runBy', 'firstName lastName').sort({ businessDate: -1 });
    res.status(200).json({ success: true, data: audits });
  } catch (error) {
    next(error);
  }
};

const getAuditReport = async (req, res, next) => {
  try {
    const audit = await NightAudit.findById(req.params.id).populate('runBy', 'firstName lastName');
    if (!audit) throw new ApiError(404, 'Audit record not found');
    res.status(200).json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

module.exports = { runChecks, closeBusinessDay, getAuditHistory, getAuditReport };