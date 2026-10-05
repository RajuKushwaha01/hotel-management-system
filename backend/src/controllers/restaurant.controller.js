const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Folio = require('../models/Folio');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../socket');
const { notifyRole } = require('../services/notify');
const { consumeStock } = require('../services/inventoryDeduction');

// ---------- TABLES ----------
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({ isMergedChild: false }).sort({ tableNumber: 1 });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
};

const createTable = async (req, res, next) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, message: 'Table added', data: table });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) throw new ApiError(404, 'Table not found');
    res.status(200).json({ success: true, message: 'Table updated', data: table });
  } catch (error) {
    next(error);
  }
};

const mergeTables = async (req, res, next) => {
  try {
    const { primaryTableId, tableIdsToMerge } = req.body;

    await Table.findByIdAndUpdate(primaryTableId, { $push: { mergedWith: {$each: tableIdsToMerge } } });
    await Table.updateMany({ _id: { $in: tableIdsToMerge } }, { isMergedChild: true, status: 'occupied' });
    const primary = await Table.findByIdAndUpdate(primaryTableId, { status: 'occupied' }, { new: true });

    res.status(200).json({ success: true, message: 'Tables merged', data: primary });
  } catch (error) {
    next(error);
  }
};

const splitTables = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) throw new ApiError(404, 'Table not found');

    await Table.updateMany({ _id: { $in: table.mergedWith } }, { isMergedChild: false, status: 'available' });
    table.mergedWith = [];
    table.status = 'available';
    await table.save();

    res.status(200).json({ success: true, message: 'Tables split', data: table });
  } catch (error) {
    next(error);
  }
};

// ---------- MENU ----------
const getMenu = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, message: 'Menu item added', data: item });
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new ApiError(404, 'Menu item not found');
    res.status(200).json({ success: true, message: 'Menu item updated', data: item });
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Menu item removed' });
  } catch (error) {
    next(error);
  }
};

// ---------- ORDERS ----------
const createOrder = async (req, res, next) => {
  try {
    const { orderType, tableId, bookingId, roomNumber, items } = req.body;

    const menuItems = await MenuItem.find({ _id: { $in: items.map((i) => i.menuItemId) } });
    const orderItems = items.map((i) => {
      const menuItem = menuItems.find((m) => m._id.toString() === i.menuItemId);
      if (!menuItem) throw new ApiError(400, 'One or more menu items not found');
      if (menuItem.availability === 'out_of_stock') throw new ApiError(400, `${menuItem.name} is out of stock`);
      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: i.quantity,
        notes: i.notes,
      };
    });

    const order = new Order({
      orderType: orderType || 'dine_in',
      table: tableId || undefined,
      booking: bookingId || undefined,
      roomNumber,
      items: orderItems,
      createdBy: req.user._id,
    });
    order.calculateTotals();
    await order.save();

    if (tableId) await Table.findByIdAndUpdate(tableId, { status: 'occupied' });

    const populated = await order.populate('table', 'tableNumber');

    // Real-time push to Kitchen Display System
    try {
      getIO().to('kitchen').emit('new-kot', populated);
    } catch (_) {}

    await notifyRole({
      role: 'chef',
      type: 'new_kot',
      title: 'New Order',
      message: `Order #${order._id.toString().slice(-6)} — ${populated.table ? `Table ${populated.table.tableNumber}` : `Room ${roomNumber}`}`,
      link: '/kitchen/dashboard',
    });

    res.status(201).json({ success: true, message: 'Order sent to kitchen', data: populated });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { status, orderType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber')
      .populate('booking', 'guest room')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const cancelOrderItem = async (req, res, next) => {
  try {
    const { itemId, reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found');

    const item = order.items.id(itemId);
    if (!item) throw new ApiError(404, 'Item not found in order');

    item.cancelled = true;
    item.cancelReason = reason;
    order.calculateTotals();
    await order.save();

    res.status(200).json({ success: true, message: 'Item cancelled', data: order });
  } catch (error) {
    next(error);
  }
};

const serveOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status !== 'ready') throw new ApiError(400, 'Order is not ready to be served yet');

    order.status = 'served';
    order.servedAt = new Date();

    // Inventory ──► Restaurant: deduct each dish's recipe ingredients now that it's actually served
    const menuItems = await MenuItem.find({ _id: { $in: order.items.filter((i) => !i.cancelled).map((i) => i.menuItem) } });
    const consumptions = [];
    order.items.filter((i) => !i.cancelled).forEach((orderItem) => {
      const menuItem = menuItems.find((m) => m._id.toString() === orderItem.menuItem.toString());
      (menuItem?.recipe || []).forEach((r) => {
        consumptions.push({ itemId: r.item, quantity: r.quantityPerServing * orderItem.quantity });
      });
    });
    if (consumptions.length > 0) {
      await consumeStock({ consumptions, reason: `Order #${order._id.toString().slice(-6)} served`, performedBy: req.user._id, req });
    }

    await order.save();

    // Room service: charge automatically to the guest folio
    if (order.orderType === 'room_service' && order.booking) {
      await Folio.findOneAndUpdate(
        { booking: order.booking },
        {
          $push: {
            charges: {
              type: 'restaurant',
              description: `Room service order #${order._id.toString().slice(-6)}`,
              amount: order.total,
              addedBy: req.user._id,
            },
          },
        }
      );
      order.paymentStatus = 'charged_to_room';
      await order.save();
    }

    res.status(200).json({ success: true, message: 'Order served', data: order });
  } catch (error) {
    next(error);
  }
};

const closeOrder = async (req, res, next) => {
  try {
    const { discount, serviceCharge, paymentMethod } = req.body;
    const order = await Order.findById(req.params.id).populate('table');
    if (!order) throw new ApiError(404, 'Order not found');

    if (discount !== undefined) order.discount = discount;
    if (serviceCharge !== undefined) order.serviceCharge = serviceCharge;
    order.calculateTotals();
    order.paymentStatus = 'paid';
    await order.save();

    if (order.table) await Table.findByIdAndUpdate(order.table._id, { status: 'cleaning' });

    res.status(200).json({ success: true, message: 'Bill closed', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTables, createTable, updateTable, mergeTables, splitTables,
  getMenu, createMenuItem, updateMenuItem, deleteMenuItem,
  createOrder, getOrders, cancelOrderItem, serveOrder, closeOrder,
};