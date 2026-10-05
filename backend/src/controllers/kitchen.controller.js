const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const InventoryItem = require('../models/InventoryItem');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../socket');

// ---------- KDS ----------
const getKOTs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : { status: { $ne: 'served' } };

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber')
      .sort({ priority: -1, createdAt: 1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateKOTStatus = async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;
    const order = await Order.findById(req.params.id).populate('table', 'tableNumber');
    if (!order) throw new ApiError(404, 'Order not found');

    order.status = status;
    if (status === 'cancelled') order.cancelReason = cancelReason;
    await order.save();

    // Notify restaurant staff (and customer room-service tracker) in real time
    try {
      getIO().emit('kot-status-updated', { orderId: order._id, status, order });
    } catch (_) {}

    res.status(200).json({ success: true, message: `Order marked as ${status}`, data: order });
  } catch (error) {
    next(error);
  }
};

// ---------- FOOD AVAILABILITY ----------
const updateFoodAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { availability }, { new: true });
    if (!item) throw new ApiError(404, 'Menu item not found');

    try {
      getIO().emit('menu-availability-updated', item);
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Availability updated', data: item });
  } catch (error) {
    next(error);
  }
};

// ---------- KITCHEN INVENTORY ----------
const getKitchenInventory = async (req, res, next) => {
  try {
    const items = await InventoryItem.find({ department: 'kitchen' }).sort({ category: 1, name: 1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const updateKitchenStock = async (req, res, next) => {
  try {
    const { currentStock } = req.body;
    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, department: 'kitchen' },
      { currentStock },
      { new: true }
    );
    if (!item) throw new ApiError(404, 'Inventory item not found');

    res.status(200).json({ success: true, message: 'Stock updated', data: item });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKOTs, updateKOTStatus, updateFoodAvailability,
  getKitchenInventory, updateKitchenStock,
};