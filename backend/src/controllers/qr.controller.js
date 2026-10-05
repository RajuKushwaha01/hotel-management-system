const Table = require('../models/Table');
const Room = require('../models/Room');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const HousekeepingTask = require('../models/HousekeepingTask');
const ServiceRequest = require('../models/ServiceRequest');
const Folio = require('../models/Folio');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../socket');
const { notifyRole } = require('../services/notify');

const groupMenu = async () => {
  const items = await MenuItem.find({ availability: { $ne: 'out_of_stock' } }).sort({ category: 1, name: 1 });
  const grouped = {};
  items.forEach((i) => { (grouped[i.category] = grouped[i.category] || []).push(i); });
  return grouped;
};

// ===== QR MENU (scan at a table → digital menu → order) =====

const getQRMenu = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.tableId).select('tableNumber capacity status');
    if (!table) throw new ApiError(404, 'This table QR code is no longer valid');

    res.status(200).json({ success: true, data: { table, menu: await groupMenu() } });
  } catch (error) {
    next(error);
  }
};

const createQRMenuOrder = async (req, res, next) => {
  try {
    const { guestName, guestPhone, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Your cart is empty');

    const table = await Table.findById(req.params.tableId);
    if (!table) throw new ApiError(404, 'This table QR code is no longer valid');

    const menuItems = await MenuItem.find({ _id: { $in: items.map((i) => i.menuItemId) } });
    const orderItems = items.map((i) => {
      const menuItem = menuItems.find((m) => m._id.toString() === i.menuItemId);
      if (!menuItem) throw new ApiError(400, 'One or more items are no longer available');
      if (menuItem.availability === 'out_of_stock') throw new ApiError(400, `${menuItem.name} is out of stock`);
      return { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: Math.max(1, Number(i.quantity) || 1) };
    });

    const order = new Order({
      orderType: 'dine_in',
      table: table._id,
      items: orderItems,
      specialRequests: guestName ? `Guest: ${guestName}${guestPhone ? ` (${guestPhone})` : ''}` : undefined,
    });
    order.calculateTotals();
    await order.save();

    await Table.findByIdAndUpdate(table._id, { status: 'occupied' });

    const populated = await order.populate('table', 'tableNumber');
    try { getIO().to('kitchen').emit('new-kot', populated); } catch (_) {}
    await notifyRole({ role: 'chef', type: 'new_kot', title: 'New QR Order', message: `Table ${table.tableNumber} placed a self-service order.`, link: '/kitchen/dashboard' });

    res.status(201).json({ success: true, message: 'Order sent to the kitchen!', data: { orderId: order._id, total: order.total } });
  } catch (error) {
    next(error);
  }
};

const getOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).select('status items total createdAt');
    if (!order) throw new ApiError(404, 'Order not found');
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ===== QR ROOM (scan in-room → services, facilities, requests) =====

const FACILITIES = [
  { name: 'Swimming Pool', hours: '6 AM – 9 PM' },
  { name: 'Restaurant', hours: '7 AM – 11 PM' },
  { name: 'Fitness Center', hours: '24 hours' },
  { name: 'Spa', hours: '10 AM – 8 PM' },
  { name: 'Free Wi-Fi', hours: 'Network: GrandVista-Guest' },
];

const getQRRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomNumber: req.params.roomNumber }).select('roomNumber roomType');
    if (!room) throw new ApiError(404, 'This room QR code is no longer valid');

    const booking = await Booking.findOne({ room: room._id, status: 'checked_in' })
      .populate('guest', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        room,
        guestFirstName: booking?.guest?.firstName || null,
        hasActiveStay: !!booking,
        bookingId: booking?._id || null,
        facilities: FACILITIES,
      },
    });
  } catch (error) {
    next(error);
  }
};

const findActiveBookingForRoom = async (roomNumber) => {
  const room = await Room.findOne({ roomNumber });
  if (!room) throw new ApiError(404, 'This room QR code is no longer valid');
  const booking = await Booking.findOne({ room: room._id, status: 'checked_in' });
  if (!booking) throw new ApiError(400, 'No active stay found for this room. Please contact the front desk.');
  return { room, booking };
};

const requestHousekeeping = async (req, res, next) => {
  try {
    const { room, booking } = await findActiveBookingForRoom(req.params.roomNumber);

    const existing = await HousekeepingTask.findOne({ room: room._id, status: { $ne: 'clean' } });
    if (existing) return res.status(200).json({ success: true, message: 'A cleaning request for your room is already in progress.' });

    await HousekeepingTask.create({ room: room._id, priority: 'normal' });
    await notifyRole({ role: 'housekeeping', type: 'cleaning_assignment', title: 'Guest Housekeeping Request', message: `Room ${room.roomNumber} requested cleaning via QR.`, link: '/housekeeping/dashboard' });

    res.status(201).json({ success: true, message: 'Housekeeping has been notified. They will be with you shortly.' });
  } catch (error) {
    next(error);
  }
};

const contactReception = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) throw new ApiError(400, 'Please enter a message');
    const { room, booking } = await findActiveBookingForRoom(req.params.roomNumber);

    await ServiceRequest.create({ guest: booking.guest, booking: booking._id, type: 'guest_request', details: `[Room ${room.roomNumber} QR] ${message.trim()}` });
    await notifyRole({ role: 'receptionist', type: 'guest_request', title: 'Guest Request', message: `Room ${room.roomNumber}: ${message.trim()}`, link: '/receptionist/services' });

    res.status(201).json({ success: true, message: 'Your message has been sent to the front desk.' });
  } catch (error) {
    next(error);
  }
};

const orderRoomService = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Your cart is empty');

    const { room, booking } = await findActiveBookingForRoom(req.params.roomNumber);

    const menuItems = await MenuItem.find({ _id: { $in: items.map((i) => i.menuItemId) } });
    const orderItems = items.map((i) => {
      const menuItem = menuItems.find((m) => m._id.toString() === i.menuItemId);
      if (!menuItem) throw new ApiError(400, 'One or more items are no longer available');
      return { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: Math.max(1, Number(i.quantity) || 1) };
    });

    const order = new Order({ orderType: 'room_service', booking: booking._id, roomNumber: room.roomNumber, items: orderItems });
    order.calculateTotals();
    await order.save();

    try { getIO().to('kitchen').emit('new-kot', order); } catch (_) {}
    await notifyRole({ role: 'chef', type: 'new_kot', title: 'New Room Service Order', message: `Room ${room.roomNumber} ordered room service.`, link: '/kitchen/dashboard' });

    res.status(201).json({ success: true, message: 'Your order has been sent to the kitchen and will be charged to your room.', data: { orderId: order._id, total: order.total } });
  } catch (error) {
    next(error);
  }
};

const getRoomServiceMenu = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await groupMenu() });
  } catch (error) {
    next(error);
  }
};

// ===== QR INVOICE VERIFICATION =====

const maskName = (first, last) => `${first} ${last?.[0] || ''}.`;

const verifyInvoice = async (req, res, next) => {
  try {
    const folio = await Folio.findOne({ verificationCode: req.params.code })
      .populate('guest', 'firstName lastName')
      .populate({ path: 'booking', populate: { path: 'room', select: 'roomType roomNumber' } });

    if (!folio) return res.status(200).json({ success: true, data: { valid: false } });

    const breakdown = folio.getBreakdown();

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        hotelName: 'GrandVista Hotel',
        guestName: maskName(folio.guest.firstName, folio.guest.lastName),
        roomType: folio.booking?.room?.roomType,
        checkIn: folio.booking?.checkIn,
        checkOut: folio.booking?.checkOut,
        totalAmount: breakdown.totalCharges,
        totalPaid: breakdown.totalPaid,
        status: breakdown.balance <= 0 ? 'Fully Paid' : 'Balance Due',
        issuedDate: folio.updatedAt,
        invoiceRef: folio.verificationCode.toUpperCase(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQRMenu, createQRMenuOrder, getOrderStatus,
  getQRRoom, requestHousekeeping, contactReception, orderRoomService, getRoomServiceMenu,
  verifyInvoice,
};