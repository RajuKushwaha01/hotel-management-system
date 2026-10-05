const Booking = require('../models/Booking');
const Folio = require('../models/Folio');
const HousekeepingTask = require('../models/HousekeepingTask');
const Order = require('../models/Order');
const StockTransaction = require('../models/StockTransaction');
const AuditLog = require('../models/AuditLog');

// Given a bookingId, reconstructs the actual end-to-end path that guest's stay took through
// the system — the "front diagram" made real, from real documents, not from imagination.
const traceBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('guest', 'firstName lastName')
      .populate('room', 'roomNumber roomType');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const folio = await Folio.findOne({ booking: booking._id });
    const housekeepingTasks = await HousekeepingTask.find({ room: booking.room?._id, createdAt: { $gte: booking.checkIn } }).limit(5);
    const orders = await Order.find({ booking: booking._id });
    const auditTrail = await AuditLog.find({ targetId: booking._id }).sort({ createdAt: 1 }).select('action description createdAt userName');

    const steps = [
      { stage: 'Booking Created', at: booking.createdAt, done: true },
      { stage: 'Payment / Reservation', at: booking.createdAt, done: booking.paymentStatus !== 'unpaid' || booking.advanceCollected > 0 },
      { stage: 'Check-In', at: booking.actualCheckInTime, done: !!booking.actualCheckInTime },
      { stage: 'Housekeeping Assigned', at: housekeepingTasks[0]?.createdAt, done: housekeepingTasks.length > 0 },
      { stage: 'Restaurant / Room Service', at: orders[0]?.createdAt, done: orders.length > 0 },
      { stage: 'Folio Charges', at: folio?.charges?.[0]?.createdAt, done: (folio?.charges?.length || 0) > 0 },
      { stage: 'Billing / Payment', at: folio?.payments?.[0]?.createdAt, done: (folio?.payments?.length || 0) > 0 },
      { stage: 'Check-Out', at: booking.actualCheckOutTime, done: !!booking.actualCheckOutTime },
      { stage: 'Invoice Issued', at: folio?.updatedAt, done: !!folio?.verificationCode },
    ];

    res.status(200).json({
      success: true,
      data: {
        booking: { id: booking._id, guest: `${booking.guest.firstName} ${booking.guest.lastName}`, room: booking.room?.roomNumber, status: booking.status },
        steps,
        folioBreakdown: folio?.getBreakdown() || null,
        housekeepingTasks: housekeepingTasks.map((t) => ({ status: t.status, at: t.createdAt })),
        orders: orders.map((o) => ({ type: o.orderType, status: o.status, total: o.total })),
        auditTrail,
      },
    });
  } catch (error) {
    next(error);
  }
};

// System-wide health check for the "behind the scenes" diagram: proves the inventory
// deduction pipeline, staff→attendance link, and audit coverage are actually firing.
const getPipelineHealth = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [stockConsumedEvents, restaurantDeductions, housekeepingDeductions, maintenanceDeductions, totalAuditEvents, attendanceLinkedToStaff] = await Promise.all([
      StockTransaction.countDocuments({ type: 'stock_out', createdAt: { $gte: since } }),
      StockTransaction.countDocuments({ type: 'stock_out', reason: /served/i, createdAt: { $gte: since } }),
      StockTransaction.countDocuments({ type: 'stock_out', reason: /cleaned/i, createdAt: { $gte: since } }),
      StockTransaction.countDocuments({ type: 'stock_out', reason: /Repair/i, createdAt: { $gte: since } }),
      AuditLog.countDocuments({ createdAt: { $gte: since } }),
      require('../models/Attendance').countDocuments({ createdAt: { $gte: since } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        inventoryToRestaurant: restaurantDeductions,
        inventoryToHousekeeping: housekeepingDeductions,
        inventoryToMaintenance: maintenanceDeductions,
        totalStockDeductions7d: stockConsumedEvents,
        staffToAttendance7d: attendanceLinkedToStaff,
        allActionsToAuditLog7d: totalAuditEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { traceBooking, getPipelineHealth };