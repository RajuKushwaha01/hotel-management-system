const HousekeepingTask = require('../models/HousekeepingTask');
const Room = require('../models/Room');
const InventoryItem = require('../models/InventoryItem');
const LostFound = require('../models/LostFound');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../socket');
const { notifyRole } = require('../services/notify');
const { consumeStock } = require('../services/inventoryDeduction');
const { broadcastRoomStatus } = require('../services/roomStatusBroadcast');

// ---------- DASHBOARD ----------
const getDashboard = async (req, res, next) => {
  try {
    const [assigned, dirty, cleaning, available, inspectionPending, maintenanceRooms, urgentTasks] = await Promise.all([
      HousekeepingTask.countDocuments({ assignedTo: req.user._id, status: { $ne: 'clean' } }),
      Room.countDocuments({ status: 'dirty' }),
      Room.countDocuments({ status: 'cleaning' }),
      Room.countDocuments({ status: 'available' }),
      HousekeepingTask.countDocuments({ status: 'inspection' }),
      Room.countDocuments({ status: 'maintenance' }),
      HousekeepingTask.countDocuments({ priority: { $in: ['high', 'urgent'] }, status: {$ne: 'clean' } }),
    ]);

    res.status(200).json({
      success: true,
      data: { assigned, dirty, cleaning, available, inspectionPending, maintenanceRooms, urgentTasks },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- TASKS ----------
const getTasks = async (req, res, next) => {
  try {
    const { status, mine } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (mine === 'true') filter.assignedTo = req.user._id;

    const tasks = await HousekeepingTask.find(filter)
      .populate('room', 'roomNumber roomType floor status')
      .populate('assignedTo', 'firstName lastName')
      .sort({ priority: -1, createdAt: 1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

// Auto-create a task when a room becomes dirty
const createTask = async (req, res, next) => {
  try {
    const { roomId, priority, assignedTo } = req.body;

    const existing = await HousekeepingTask.findOne({ room: roomId, status: { $ne: 'clean' } });
    if (existing) throw new ApiError(400, 'An active task already exists for this room');

    const task = await HousekeepingTask.create({ room: roomId, priority, assignedTo });
    const populated = await task.populate('room', 'roomNumber roomType');

    res.status(201).json({ success: true, message: 'Task created', data: populated });
  } catch (error) {
    next(error);
  }
};

const acceptTask = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');

    task.assignedTo = req.user._id;
    task.status = 'accepted';
    await task.save();

    res.status(200).json({ success: true, message: 'Task accepted', data: task });
  } catch (error) {
    next(error);
  }
};

const startCleaning = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');

    task.status = 'cleaning';
    task.startedAt = new Date();
    await task.save();

    const cleaningRoom = await Room.findByIdAndUpdate(task.room, { status: 'cleaning' }, { new: true });
    if (cleaningRoom) broadcastRoomStatus(cleaningRoom);

    res.status(200).json({ success: true, message: 'Cleaning started', data: task });
  } catch (error) {
    next(error);
  }
};

const STANDARD_CLEANING_KIT = [
  { category: 'Towels', quantity: 2 },
  { category: 'Sheets', quantity: 1 },
  { category: 'Soap', quantity: 1 },
  { category: 'Shampoo', quantity: 1 },
];

const completeCleaning = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');

    task.status = 'inspection';
    task.completedAt = new Date();
    await task.save();

    // FIXED: Updated room status from 'inspected' to 'inspection' to adhere to Room model schema enums
    const inspectedRoom = await Room.findByIdAndUpdate(task.room, { status: 'inspection' }, { new: true });
    if (inspectedRoom) broadcastRoomStatus(inspectedRoom);

    // Inventory ──► Housekeeping: deduct standard consumables used for this clean
    const housekeepingItems = await InventoryItem.find({ department: 'housekeeping', category: { $in: STANDARD_CLEANING_KIT.map((k) => k.category) } });
    const consumptions = STANDARD_CLEANING_KIT
      .map((kit) => {
        const item = housekeepingItems.find((i) => i.category === kit.category);
        return item ? { itemId: item._id, quantity: kit.quantity } : null;
      })
      .filter(Boolean);

    if (consumptions.length > 0) {
      await consumeStock({ consumptions, reason: `Room ${task.room} cleaned`, performedBy: req.user._id, req });
    }

    res.status(200).json({ success: true, message: 'Cleaning completed, sent for inspection', data: task });
  } catch (error) {
    next(error);
  }
};

const markClean = async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');

    task.status = 'clean';
    task.inspectedBy = req.user._id;
    task.inspectedAt = new Date();
    await task.save();

    // FIXED: Updated room status from 'clean' to 'available' to adhere to Room model schema enums
    const cleanRoom = await Room.findByIdAndUpdate(task.room, { status: 'available', isBookable: true }, { new: true });
    if (cleanRoom) broadcastRoomStatus(cleanRoom);

    res.status(200).json({ success: true, message: 'Room marked clean and available', data: task });
  } catch (error) {
    next(error);
  }
};

const reportDamage = async (req, res, next) => {
  try {
    const { description } = req.body;
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');

    task.damageReport = { description, reportedAt: new Date() };
    await task.save();

    // Notify maintenance in real time
    try {
      getIO().to('maintenance').emit('new-damage-report', { taskId: task._id, roomId: task.room, description });
    } catch (_) {}

    await notifyRole({
      role: 'maintenance',
      type: 'maintenance_request',
      title: 'Damage Reported',
      message: `Room ${task.room} — ${description}`,
      link: '/maintenance/dashboard',
    });

    res.status(200).json({ success: true, message: 'Damage reported to maintenance', data: task });
  } catch (error) {
    next(error);
  }
};

const reportMissingItem = async (req, res, next) => {
  try {
    const { itemName, quantity } = req.body;
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) throw new ApiError(404, 'Task not found');

    task.missingItems.push({ itemName, quantity, reportedAt: new Date() });
    await task.save();

    res.status(200).json({ success: true, message: 'Missing item reported', data: task });
  } catch (error) {
    next(error);
  }
};

// ---------- INVENTORY (housekeeping) ----------
const getInventory = async (req, res, next) => {
  try {
    const items = await InventoryItem.find({ department: 'housekeeping' }).sort({ name: 1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const updateInventoryStock = async (req, res, next) => {
  try {
    const { currentStock } = req.body;
    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, department: 'housekeeping' },
      { currentStock },
      { new: true }
    );
    if (!item) throw new ApiError(404, 'Inventory item not found');

    res.status(200).json({ success: true, message: 'Stock updated', data: item });
  } catch (error) {
    next(error);
  }
};

// ---------- LOST & FOUND ----------
const createLostFoundItem = async (req, res, next) => {
  try {
    const { itemDescription, photo, foundLocation, guestAssociation } = req.body;

    const item = await LostFound.create({
      itemDescription,
      photo,
      foundLocation,
      guestAssociation,
      reportedBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Item logged', data: item });
  } catch (error) {
    next(error);
  }
};

const getLostFoundItems = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const items = await LostFound.find(filter)
      .populate('reportedBy', 'firstName lastName')
      .populate('guestAssociation', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const updateLostFoundStatus = async (req, res, next) => {
  try {
    const { status, handedToName } = req.body;
    const item = await LostFound.findById(req.params.id);
    if (!item) throw new ApiError(404, 'Item not found');

    item.status = status;
    if (status === 'claimed') {
      item.handoverRecord = { handedToName, handedOverAt: new Date(), handedOverBy: req.user._id };
    }
    await item.save();

    res.status(200).json({ success: true, message: 'Status updated', data: item });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getTasks,
  createTask,
  acceptTask,
  startCleaning,
  completeCleaning,
  markClean,
  reportDamage,
  reportMissingItem,
  getInventory,
  updateInventoryStock,
  createLostFoundItem,
  getLostFoundItems,
  updateLostFoundStatus,
};