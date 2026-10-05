const Booking = require('../models/Booking');
const Folio = require('../models/Folio');
const Order = require('../models/Order');
const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');

const dateRange = (from, to) => {
  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) filter.$lte = new Date(to);
  return Object.keys(filter).length ? filter : undefined;
};

// ---------- DASHBOARD ----------
const getDashboard = async (req, res, next) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const [todayBookings, monthBookings, todayOrders, monthExpenses, outstandingBookings] = await Promise.all([
      Booking.find({ createdAt: { $gte: startOfDay, $lte: endOfDay }, status: {$ne: 'cancelled' } }),
      Booking.find({ createdAt: { $gte: startOfMonth }, status: {$ne: 'cancelled' } }),
      Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay }, status: {$ne: 'cancelled' } }),
      Expense.find({ date: { $gte: startOfMonth } }),
      Booking.find({ paymentStatus: { $ne: 'paid' }, status: {$ne: 'cancelled' } }),
    ]);

    const todayRoomRevenue = todayBookings.reduce((s, b) => s + b.totalAmount, 0);
    const todayRestaurantRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const monthlyRevenue = monthBookings.reduce((s, b) => s + b.totalAmount, 0);
    const monthlyExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const outstandingBalance = outstandingBookings.reduce((s, b) => s + (b.totalAmount - b.advanceCollected), 0);

    res.status(200).json({
      success: true,
      data: {
        todayRevenue: todayRoomRevenue + todayRestaurantRevenue,
        monthlyRevenue,
        roomRevenue: todayRoomRevenue,
        restaurantRevenue: todayRestaurantRevenue,
        serviceRevenue: 0, // reserved for future service-only breakdown
        expenses: monthlyExpenses,
        tax: Math.round(monthlyRevenue * 0.12),
        refunds: 0,
        outstandingBalance,
        profitLoss: monthlyRevenue - monthlyExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- PAYMENTS ----------
const getAllPayments = async (req, res, next) => {
  try {
    const { method, from, to } = req.query;
    const folios = await Folio.find({ 'payments.0': { $exists: true } })
      .populate('guest', 'firstName lastName')
      .populate('booking', 'room');

    let payments = [];
    folios.forEach((folio) => {
      folio.payments.forEach((p) => {
        payments.push({
          _id: p._id,
          guest: folio.guest,
          amount: p.amount,
          method: p.method,
          note: p.note,
          createdAt: p.createdAt,
        });
      });
    });

    if (method) payments = payments.filter((p) => p.method === method);
    if (from) payments = payments.filter((p) => new Date(p.createdAt) >= new Date(from));
    if (to) payments = payments.filter((p) => new Date(p.createdAt) <= new Date(to));

    payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { bookingId, amount, reason } = req.body;
    const folio = await Folio.findOne({ booking: bookingId });
    if (!folio) throw new ApiError(404, 'Folio not found');

    folio.charges.push({
      type: 'discount',
      description: `Refund: ${reason}`,
      amount: -Math.abs(amount),
      addedBy: req.user._id,
    });
    await folio.save();

    res.status(200).json({ success: true, message: 'Refund processed', data: folio });
  } catch (error) {
    next(error);
  }
};

// ---------- BILLING ----------
const getInvoice = async (req, res, next) => {
  try {
    const folio = await Folio.findOne({ booking: req.params.bookingId })
      .populate('guest', 'firstName lastName email phone address')
      .populate('booking');
    if (!folio) throw new ApiError(404, 'Invoice not found');

    res.status(200).json({ success: true, data: { ...folio.toObject(), totals: folio.getTotals() } });
  } catch (error) {
    next(error);
  }
};

const applyAdjustment = async (req, res, next) => {
  try {
    const { type, description, amount } = req.body; // type: 'credit' | 'debit'
    const folio = await Folio.findOne({ booking: req.params.bookingId });
    if (!folio) throw new ApiError(404, 'Folio not found');

    folio.charges.push({
      type: 'misc',
      description: `${type === 'credit' ? 'Credit' : 'Debit'} adjustment: ${description}`,
      amount: type === 'credit' ? -Math.abs(amount) : Math.abs(amount),
      addedBy: req.user._id,
    });
    await folio.save();

    res.status(200).json({ success: true, message: 'Adjustment applied', data: { ...folio.toObject(), totals: folio.getTotals() } });
  } catch (error) {
    next(error);
  }
};

// ---------- EXPENSES ----------
const getExpenses = async (req, res, next) => {
  try {
    const { category, from, to } = req.query;
    const filter = {};
    if (category) filter.category = category;
    const range = dateRange(from, to);
    if (range) filter.date = range;

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, recordedBy: req.user._id });
    res.status(201).json({ success: true, message: 'Expense recorded', data: expense });
  } catch (error) {
    next(error);
  }
};

const approveExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, { approvedBy: req.user._id, approvedAt: new Date() }, { new: true });
    if (!expense) throw new ApiError(404, 'Expense not found');
    res.status(200).json({ success: true, message: 'Expense approved', data: expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Expense removed' });
  } catch (error) {
    next(error);
  }
};

// ---------- REPORTS ----------
const getRevenueReport = async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query; // daily | monthly
    const daysBack = period === 'monthly' ? 180 : 14;
    const start = new Date();
    start.setDate(start.getDate() - daysBack);

    const bookings = await Booking.find({ createdAt: { $gte: start }, status: {$ne: 'cancelled' } });

    const grouped = {};
    bookings.forEach((b) => {
      const key = period === 'monthly'
        ? `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`
        : b.createdAt.toISOString().slice(0, 10);
      grouped[key] = (grouped[key] || 0) + b.totalAmount;
    });

    const data = Object.entries(grouped).sort().map(([label, revenue]) => ({ label, revenue }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getProfitLossReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || { $gte: new Date(new Date().setDate(1)) };

    const [bookings, expenses] = await Promise.all([
      Booking.find({ createdAt: range, status: { $ne: 'cancelled' } }),
      Expense.find({ date: range }),
    ]);

    const revenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
    const expenseByCategory = {};
    expenses.forEach((e) => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    res.status(200).json({
      success: true,
      data: { revenue, totalExpenses, profit: revenue - totalExpenses, expenseByCategory },
    });
  } catch (error) {
    next(error);
  }
};

const getOutstandingReport = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ paymentStatus: { $ne: 'paid' }, status: {$ne: 'cancelled' } })
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber');

    const data = bookings.map((b) => ({
      _id: b._id,
      guest: b.guest,
      room: b.room,
      totalAmount: b.totalAmount,
      advanceCollected: b.advanceCollected,
      balance: b.totalAmount - b.advanceCollected,
      status: b.status,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard, getAllPayments, processRefund, getInvoice, applyAdjustment,
  getExpenses, createExpense, approveExpense, deleteExpense,
  getRevenueReport, getProfitLossReport, getOutstandingReport,
};