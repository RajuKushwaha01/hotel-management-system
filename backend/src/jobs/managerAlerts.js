const Room = require('../models/Room');
const Booking = require('../models/Booking');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const InventoryItem = require('../models/InventoryItem');
const Complaint = require('../models/Complaint');
const { notifyRole } = require('../services/notify');

const runManagerAlerts = async () => {
  try {
    // Low occupancy (below 40%)
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: { $in: ['occupied', 'reserved'] } });
    const occupancyRate = totalRooms ? (occupiedRooms / totalRooms) * 100 : 0;
    if (occupancyRate < 40) {
      await notifyRole({
        role: 'hotel_manager', type: 'low_occupancy', title: 'Low Occupancy Alert',
        message: `Current occupancy is ${occupancyRate.toFixed(1)}% — consider promotional offers.`,
        link: '/manager/dashboard',
      });
    }

    // High cancellation rate today (above 20%)
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const todayBookings = await Booking.countDocuments({ createdAt: { $gte: startOfDay } });
    const todayCancellations = await Booking.countDocuments({ createdAt: { $gte: startOfDay }, status: 'cancelled' });
    if (todayBookings > 0 && (todayCancellations / todayBookings) * 100 > 20) {
      await notifyRole({
        role: 'hotel_manager', type: 'high_cancellation', title: 'High Cancellation Rate',
        message: `${todayCancellations} of ${todayBookings} bookings cancelled today.`,
        link: '/manager/reservations',
      });
    }

    // High-priority open maintenance issues
    const urgentTickets = await MaintenanceTicket.countDocuments({ priority: { $in: ['high', 'urgent'] }, status: { $nin: ['closed', 'verified'] } });
    if (urgentTickets > 0) {
      await notifyRole({
        role: 'hotel_manager', type: 'maintenance_issue', title: 'Urgent Maintenance Pending',
        message: `${urgentTickets} high-priority maintenance ticket(s) still open.`,
        link: '/manager/maintenance',
      });
    }

    // Low stock across inventory
    const items = await InventoryItem.find();
    const lowStockCount = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length;
    if (lowStockCount > 0) {
      await notifyRole({
        role: 'hotel_manager', type: 'low_stock', title: 'Inventory Running Low',
        message: `${lowStockCount} item(s) are low or out of stock.`,
        link: '/manager/inventory',
      });
    }

    // Pending payments
    const pendingPaymentBookings = await Booking.countDocuments({ paymentStatus: { $ne: 'paid' }, status: { $ne: 'cancelled' } });
    if (pendingPaymentBookings > 0) {
      await notifyRole({
        role: 'hotel_manager', type: 'pending_payment', title: 'Pending Payments',
        message: `${pendingPaymentBookings} booking(s) have outstanding balances.`,
        link: '/accountant/dashboard',
      });
    }

    // High-priority complaints
    const openComplaints = await Complaint.countDocuments({ status: 'open' });
    if (openComplaints > 0) {
      await notifyRole({
        role: 'hotel_manager', type: 'high_priority_complaint', title: 'Unassigned Complaints',
        message: `${openComplaints} complaint(s) awaiting assignment.`,
        link: '/manager/reviews-complaints',
      });
    }

    console.log('🔔 Manager alerts check completed');
  } catch (err) {
    console.error('Manager alerts job failed:', err.message);
  }
};

const startManagerAlerts = () => {
  setInterval(runManagerAlerts, 3 * 60 * 60 * 1000); // every 3 hours (not on boot, to avoid notification spam on every restart)
};

module.exports = { startManagerAlerts, runManagerAlerts };