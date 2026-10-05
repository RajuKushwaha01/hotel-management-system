const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const { CATEGORY_MAP } = require('../models/InventoryItem');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../socket');
const { notifyRole } = require('../services/notify');

const DEPT_BY_LEVEL = { own_dept: 'housekeeping', fnb: 'kitchen', kitchen: 'kitchen', maintenance: 'maintenance' };

// ---------- DASHBOARD ----------
const getDashboard = async (req, res, next) => {
  try {
    const items = await InventoryItem.find();
    const lowStock = items.filter((i) => i.status === 'low_stock').length;
    const outOfStock = items.filter((i) => i.status === 'out_of_stock').length;
    const totalValue = items.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);

    const byDepartment = {};
    items.forEach((i) => { byDepartment[i.department] = (byDepartment[i.department] || 0) + 1; });

    res.status(200).json({ success: true, data: { totalItems: items.length, lowStock, outOfStock, totalValue, byDepartment } });
  } catch (error) {
    next(error);
  }
};

// ---------- ITEMS ----------
const getCategories = (req, res) => {
  res.status(200).json({ success: true, data: CATEGORY_MAP });
};

const getItems = async (req, res, next) => {
  try {
    const { department, category, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (category) filter.category = category;

    let items = await InventoryItem.find(filter).populate('supplier', 'name phone').sort({ department: 1, name: 1 });
    if (status) items = items.filter((i) => i.status === status);

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const createItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json({ success: true, message: 'Item added', data: item });
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) throw new ApiError(404, 'Item not found');
    res.status(200).json({ success: true, message: 'Item updated', data: item });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    await InventoryItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Item removed' });
  } catch (error) {
    next(error);
  }
};

// ---------- STOCK MOVEMENTS ----------
const stockIn = async (req, res, next) => {
  try {
    const { itemId, quantity, reason } = req.body;
    const item = await InventoryItem.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found');

    if (req.permissionLevel !== 'full') {
      const requiredDept = DEPT_BY_LEVEL[req.permissionLevel];
      if (item.department !== requiredDept) {
        throw new ApiError(403, `Your role can only manage ${requiredDept} inventory`);
      }
    }

    item.currentStock += Number(quantity);
    await item.save();

    await StockTransaction.create({
      item: itemId, type: 'stock_in', quantity, reason,
      performedBy: req.user._id, balanceAfter: item.currentStock,
    });

    res.status(200).json({ success: true, message: 'Stock added', data: item });
  } catch (error) {
    next(error);
  }
};

const stockOut = async (req, res, next) => {
  try {
    const { itemId, quantity, reason } = req.body;
    const item = await InventoryItem.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found');

    if (req.permissionLevel !== 'full') {
      const requiredDept = DEPT_BY_LEVEL[req.permissionLevel];
      if (item.department !== requiredDept) {
        throw new ApiError(403, `Your role can only manage ${requiredDept} inventory`);
      }
    }

    if (item.currentStock < quantity) throw new ApiError(400, 'Insufficient stock for this operation');

    item.currentStock -= Number(quantity);
    await item.save();

    await StockTransaction.create({
      item: itemId, type: 'stock_out', quantity, reason,
      performedBy: req.user._id, balanceAfter: item.currentStock,
    });

    // Real-time low-stock alert
    if (item.status === 'low_stock' || item.status === 'out_of_stock') {
      try {
        getIO().to('inventory').emit('low-stock-alert', { itemId: item._id, name: item.name, currentStock: item.currentStock, status: item.status });
      } catch (_) {}
    }

    if (item.status === 'low_stock' || item.status === 'out_of_stock') {
      await notifyRole({
        role: 'hotel_manager',
        type: 'low_inventory',
        title: 'Low Stock Alert',
        message: `${item.name} is ${item.status === 'out_of_stock' ? 'out of stock' : 'running low'} (${item.currentStock} ${item.unit} left).`,
        link: '/manager/inventory',
      });
    }

    res.status(200).json({ success: true, message: 'Stock deducted', data: item });
  } catch (error) {
    next(error);
  }
};

const recordWastage = async (req, res, next) => {
  try {
    const { itemId, quantity, reason } = req.body;
    const item = await InventoryItem.findById(itemId);
    if (!item) throw new ApiError(404, 'Item not found');

    if (req.permissionLevel !== 'full') {
      const requiredDept = DEPT_BY_LEVEL[req.permissionLevel];
      if (item.department !== requiredDept) {
        throw new ApiError(403, `Your role can only manage ${requiredDept} inventory`);
      }
    }

    if (item.currentStock < quantity) throw new ApiError(400, 'Wastage quantity exceeds current stock');

    item.currentStock -= Number(quantity);
    await item.save();

    await StockTransaction.create({
      item: itemId, type: 'wastage', quantity, reason,
      performedBy: req.user._id, balanceAfter: item.currentStock,
    });

    res.status(200).json({ success: true, message: 'Wastage recorded', data: item });
  } catch (error) {
    next(error);
  }
};

// ---------- HISTORY ----------
const getItemHistory = async (req, res, next) => {
  try {
    const transactions = await StockTransaction.find({ item: req.params.itemId })
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

const getLowStockItems = async (req, res, next) => {
  try {
    const items = await InventoryItem.find();
    const lowStock = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');
    res.status(200).json({ success: true, data: lowStock });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard, getCategories, getItems, createItem, updateItem, deleteItem,
  stockIn, stockOut, recordWastage, getItemHistory, getLowStockItems,
};