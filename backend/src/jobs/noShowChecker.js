const Booking = require('../models/Booking');
const { notifyUser } = require('../services/notify');

const runNoShowCheck = async () => {
  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 6);

    const result = await Booking.updateMany(
      { status: 'confirmed', checkIn: { $lt: cutoff } },
      { $set: { status: 'no_show' } }
    );
    if (result.modifiedCount > 0) console.log(`🕐 Marked ${result.modifiedCount} booking(s) as no-show`);

    // Check-in reminders: bookings checking in within the next 24 hours
    const in24h = new Date(); in24h.setHours(in24h.getHours() + 24);
    const now = new Date();
    const upcomingCheckIns = await Booking.find({ status: 'confirmed', checkIn: { $gte: now, $lte: in24h } });
    for (const b of upcomingCheckIns) {
      await notifyUser({
        recipientId: b.guest, type: 'checkin_reminder', title: 'Check-in Reminder',
        message: `Your check-in is coming up on ${new Date(b.checkIn).toLocaleDateString()}.`,
        link: '/customer/bookings',
      });
    }

    // Check-out reminders: guests checking out today
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const departingToday = await Booking.find({ status: 'checked_in', checkOut: { $gte: startOfDay, $lte: endOfDay } });
    for (const b of departingToday) {
      await notifyUser({
        recipientId: b.guest, type: 'checkout_reminder', title: 'Check-out Reminder',
        message: 'Your check-out is today. We hope you enjoyed your stay!',
        link: '/customer/bookings',
      });
    }
  } catch (err) {
    console.error('No-show checker failed:', err.message);
  }
};

const startNoShowChecker = () => {
  runNoShowCheck();
  setInterval(runNoShowCheck, 60 * 60 * 1000);
};

module.exports = { startNoShowChecker };