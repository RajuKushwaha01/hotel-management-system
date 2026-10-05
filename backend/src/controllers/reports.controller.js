const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Order = require('../models/Order');
const HousekeepingTask = require('../models/HousekeepingTask');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const Expense = require('../models/Expense');
const Folio = require('../models/Folio');

const dateRange = (from, to) => {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  return Object.keys(range).length ? range : undefined;
};

const defaultRange = (daysBack = 30) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  return { from, to };
};

// =====================================================
// 1. HOTEL ANALYTICS
// =====================================================
const getHotelReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || defaultRange(30);
    const rangeStart = range.$gte || range;
    const rangeEnd = range.$lte || new Date();

    const [bookingsInRange, totalRooms, cancelledCount, noShowCount, arrivalsCount, departuresCount] = await Promise.all([
      Booking.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: { $nin: ['cancelled', 'no_show'] } }),
      Room.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: 'cancelled' }),
      Booking.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: 'no_show' }),
      Booking.countDocuments({ checkIn: { $gte: rangeStart, $lte: rangeEnd } }),
      Booking.countDocuments({ checkOut: { $gte: rangeStart, $lte: rangeEnd } }),
    ]);

    const daysInRange = Math.max(1, Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)));
    const roomNightsAvailable = totalRooms * daysInRange;

    let roomNightsSold = 0;
    let totalStayNights = 0;
    let totalRoomRevenue = 0;

    bookingsInRange.forEach((b) => {
      const nights = Math.max(1, Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24)));
      roomNightsSold += nights;
      totalStayNights += nights;
      totalRoomRevenue += b.totalAmount;
    });

    const occupancyRate = roomNightsAvailable ? ((roomNightsSold / roomNightsAvailable) * 100).toFixed(1) : 0;
    const adr = roomNightsSold ? (totalRoomRevenue / roomNightsSold).toFixed(0) : 0; // Average Daily Rate
    const revPAR = roomNightsAvailable ? (totalRoomRevenue / roomNightsAvailable).toFixed(0) : 0; // Revenue Per Available Room
    const avgLengthOfStay = bookingsInRange.length ? (totalStayNights / bookingsInRange.length).toFixed(1) : 0;

    // Daily trend for charting
    const dailyTrend = {};
    bookingsInRange.forEach((b) => {
      const key = b.createdAt.toISOString().slice(0, 10);
      dailyTrend[key] = (dailyTrend[key] || 0) + 1;
    });
    const bookingTrend = Object.entries(dailyTrend).sort().map(([date, count]) => ({ date, bookings: count }));

    res.status(200).json({
      success: true,
      data: {
        occupancyRate: Number(occupancyRate),
        adr: Number(adr),
        revPAR: Number(revPAR),
        avgLengthOfStay: Number(avgLengthOfStay),
        arrivals: arrivalsCount,
        departures: departuresCount,
        cancellations: cancelledCount,
        noShows: noShowCount,
        totalBookings: bookingsInRange.length,
        bookingTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 2. FINANCIAL ANALYTICS
// =====================================================
const getFinancialReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || defaultRange(30);
    const rangeStart = range.$gte || range;
    const rangeEnd = range.$lte || new Date();

    const [bookings, orders, expenses, folios] = await Promise.all([
      Booking.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: { $ne: 'cancelled' } }),
      Order.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: { $ne: 'cancelled' } }),
      Expense.find({ date: { $gte: rangeStart, $lte: rangeEnd } }),
      Folio.find(),
    ]);

    const roomRevenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
    const restaurantRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalRevenue = roomRevenue + restaurantRevenue;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    let totalTax = 0, totalDiscount = 0, totalOutstanding = 0, totalRefunds = 0;
    folios.forEach((f) => {
      const b = f.getBreakdown();
      totalTax += b.tax;
      totalDiscount += b.discount;
      if (b.balance > 0) totalOutstanding += b.balance;
      const refundCharges = f.charges.filter((c) => c.description.toLowerCase().includes('refund'));
      totalRefunds += refundCharges.reduce((s, c) => s + Math.abs(c.amount), 0);
    });

    // Expense category breakdown for pie/bar chart
    const expenseByCategory = {};
    expenses.forEach((e) => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });

    // Daily revenue trend
    const dailyRevenue = {};
    bookings.forEach((b) => {
      const key = b.createdAt.toISOString().slice(0, 10);
      dailyRevenue[key] = (dailyRevenue[key] || 0) + b.totalAmount;
    });
    const revenueTrend = Object.entries(dailyRevenue).sort().map(([date, revenue]) => ({ date, revenue }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue, roomRevenue, restaurantRevenue,
        totalExpenses, totalTax, totalDiscount, totalOutstanding, totalRefunds,
        profit: totalRevenue - totalExpenses,
        expenseByCategory,
        revenueTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 3. RESTAURANT ANALYTICS
// =====================================================
const getRestaurantReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || defaultRange(30);
    const rangeStart = range.$gte || range;
    const rangeEnd = range.$lte || new Date();

    const orders = await Order.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } });
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

    const totalSales = activeOrders.reduce((s, o) => s + o.total, 0);

    // Best-selling items across all active orders
    const itemSales = {};
    activeOrders.forEach((o) => {
      o.items.filter((i) => !i.cancelled).forEach((i) => {
        if (!itemSales[i.name]) itemSales[i.name] = { name: i.name, quantity: 0, revenue: 0 };
        itemSales[i.name].quantity += i.quantity;
        itemSales[i.name].revenue += i.price * i.quantity;
      });
    });
    const bestSelling = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    if (req.permissionLevel === 'kitchen') {
      // Chef's view: hide financial totals, keep only prep-relevant figures
      return res.status(200).json({
        success: true,
        data: { bestSelling, totalOrders: activeOrders.length, cancelledOrders: cancelledOrders.length },
      });
    }

    // Category sales (dine-in vs room service as a proxy category split)
    const salesByType = { dine_in: 0, room_service: 0 };
    activeOrders.forEach((o) => { salesByType[o.orderType] = (salesByType[o.orderType] || 0) + o.total; });

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalOrders: activeOrders.length,
        cancelledOrders: cancelledOrders.length,
        cancellationRate: orders.length ? ((cancelledOrders.length / orders.length) * 100).toFixed(1) : 0,
        bestSelling,
        salesByType: Object.entries(salesByType).map(([type, revenue]) => ({ type, revenue })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 4. HOUSEKEEPING ANALYTICS
// =====================================================
const getHousekeepingReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || defaultRange(30);
    const rangeStart = range.$gte || range;
    const rangeEnd = range.$lte || new Date();

    const tasks = await HousekeepingTask.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } });

    const cleanedTasks = tasks.filter((t) => t.status === 'clean' && t.startedAt && t.completedAt);
    const pendingTasks = tasks.filter((t) => t.status !== 'clean');

    const avgCleaningMinutes = cleanedTasks.length
      ? Math.round(cleanedTasks.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.startedAt)) / 60000, 0) / cleanedTasks.length)
      : 0;

    // Cleaning volume per day for trend chart
    const dailyCleaned = {};
    cleanedTasks.forEach((t) => {
      const key = t.completedAt.toISOString().slice(0, 10);
      dailyCleaned[key] = (dailyCleaned[key] || 0) + 1;
    });
    const cleaningTrend = Object.entries(dailyCleaned).sort().map(([date, count]) => ({ date, roomsCleaned: count }));

    res.status(200).json({
      success: true,
      data: {
        roomsCleaned: cleanedTasks.length,
        pendingRooms: pendingTasks.length,
        avgCleaningMinutes,
        cleaningTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 5. MAINTENANCE ANALYTICS
// =====================================================
const getMaintenanceReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || defaultRange(30);
    const rangeStart = range.$gte || range;
    const rangeEnd = range.$lte || new Date();

    const tickets = await MaintenanceTicket.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } });

    const openRequests = tickets.filter((t) => !['closed', 'verified'].includes(t.status)).length;
    const completedRequests = tickets.filter((t) => ['completed', 'verified', 'closed'].includes(t.status)).length;
    const totalCost = tickets.reduce((s, t) => s + (t.totalCost || 0), 0);

    // Frequent problem categories
    const byCategory = {};
    tickets.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + 1; });
    const frequentProblems = Object.entries(byCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: { openRequests, completedRequests, totalCost, frequentProblems },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 6. INVENTORY ANALYTICS
// =====================================================
const getInventoryReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || defaultRange(30);
    const rangeStart = range.$gte || range;
    const rangeEnd = range.$lte || new Date();

    const items = await InventoryItem.find();
    const lowStockItems = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');

    const transactions = await StockTransaction.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }).populate('item', 'name department unit');

    const consumption = transactions.filter((t) => t.type === 'stock_out');
    const wastage = transactions.filter((t) => t.type === 'wastage');

    const consumptionByItem = {};
    consumption.forEach((t) => {
      const name = t.item?.name || 'Unknown';
      consumptionByItem[name] = (consumptionByItem[name] || 0) + t.quantity;
    });
    const topConsumed = Object.entries(consumptionByItem).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    const wastageByItem = {};
    wastage.forEach((t) => {
      const name = t.item?.name || 'Unknown';
      wastageByItem[name] = (wastageByItem[name] || 0) + t.quantity;
    });
    const topWastage = Object.entries(wastageByItem).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalItems: items.length,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((i) => ({ name: i.name, currentStock: i.currentStock, minimumStock: i.minimumStock, unit: i.unit })),
        totalConsumption: consumption.reduce((s, t) => s + t.quantity, 0),
        totalWastage: wastage.reduce((s, t) => s + t.quantity, 0),
        topConsumed,
        topWastage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// OVERVIEW (all categories, lightweight, for the summary tab)
// =====================================================
const getOverview = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = dateRange(from, to) || defaultRange(30);
    const rangeStart = range.$gte || range;
    const rangeEnd = range.$lte || new Date();

    const [bookings, orders, expenses, openTickets, lowStock] = await Promise.all([
      Booking.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: { $ne: 'cancelled' } }),
      Order.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: { $ne: 'cancelled' } }),
      Expense.find({ date: { $gte: rangeStart, $lte: rangeEnd } }),
      MaintenanceTicket.countDocuments({ status: { $nin: ['closed', 'verified'] } }),
      InventoryItem.find(),
    ]);

    const roomRevenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
    const restaurantRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const lowStockCount = lowStock.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: roomRevenue + restaurantRevenue,
        totalExpenses,
        profit: roomRevenue + restaurantRevenue - totalExpenses,
        totalBookings: bookings.length,
        openMaintenanceTickets: openTickets,
        lowStockItems: lowStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getHotelReport,
  getFinancialReport,
  getRestaurantReport,
  getHousekeepingReport,
  getMaintenanceReport,
  getInventoryReport,
};