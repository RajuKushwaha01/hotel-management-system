const MaintenanceTicket = require('../models/MaintenanceTicket');
const Room = require('../models/Room');
const ApiError = require('../utils/ApiError');
const { consumeStock } = require('../services/inventoryDeduction');

const getDashboard = async (req, res, next) => {
  try {
    const [newRequests, highPriority, assigned, inProgress, completed, outOfOrderRooms] = await Promise.all([
      MaintenanceTicket.countDocuments({ status: 'open' }),
      MaintenanceTicket.countDocuments({ priority: { $in: ['high', 'urgent'] }, status: { $nin: ['closed', 'verified'] } }),
      MaintenanceTicket.countDocuments({ status: 'assigned' }),
      MaintenanceTicket.countDocuments({ status: 'in_progress' }),
      MaintenanceTicket.countDocuments({ status: { $in: ['completed', 'verified', 'closed'] }, updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Room.countDocuments({ status: 'out_of_order' }),
    ]);

    res.status(200).json({
      success: true,
      data: { newRequests, highPriority, assigned, inProgress, completed, outOfOrderRooms },
    });
  } catch (error) {
    next(error);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const { status, category, mine } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (mine === 'true') filter.assignedTo = req.user._id;

    const tickets = await MaintenanceTicket.find(filter)
      .populate('room', 'roomNumber roomType')
      .populate('reportedBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const { roomId, category, description, priority, photos } = req.body;
    const ticket = await MaintenanceTicket.create({
      room: roomId, category, description, priority, photos,
      reportedBy: req.user._id,
    });

    if (priority === 'urgent' && roomId) {
      await Room.findByIdAndUpdate(roomId, { status: 'out_of_order' });
    }

    res.status(201).json({ success: true, message: 'Maintenance ticket created', data: ticket });
  } catch (error) {
    next(error);
  }
};

const assignTicket = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await MaintenanceTicket.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: 'assigned' },
      { new: true }
    );
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    res.status(200).json({ success: true, message: 'Ticket assigned', data: ticket });
  } catch (error) {
    next(error);
  }
};

const startWork = async (req, res, next) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(
      req.params.id,
      { status: 'in_progress', assignedTo: req.user._id },
      { new: true }
    );
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    res.status(200).json({ success: true, message: 'Work started', data: ticket });
  } catch (error) {
    next(error);
  }
};

const completeTicket = async (req, res, next) => {
  try {
    const { repairNotes, partsUsed } = req.body; // partsUsed: [{ item: <inventoryItemId>, name, quantity, cost }]
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    ticket.status = 'completed';
    ticket.repairNotes = repairNotes;
    ticket.partsUsed = partsUsed || [];
    ticket.totalCost = (partsUsed || []).reduce((s, p) => s + (p.cost || 0) * (p.quantity || 1), 0);
    ticket.completedAt = new Date();
    await ticket.save();

    // Inventory ──► Maintenance: deduct any inventory-linked spare parts actually used
    const consumptions = (partsUsed || [])
      .filter((p) => p.item)
      .map((p) => ({ itemId: p.item, quantity: p.quantity || 1 }));
    if (consumptions.length > 0) {
      await consumeStock({ consumptions, reason: `Repair: ${ticket.category} — ${repairNotes}`, performedBy: req.user._id, req });
    }

    res.status(200).json({ success: true, message: 'Repair marked completed', data: ticket });
  } catch (error) {
    next(error);
  }
};

const verifyTicket = async (req, res, next) => {
  try {
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    ticket.status = 'verified';
    ticket.verifiedBy = req.user._id;
    ticket.verifiedAt = new Date();
    await ticket.save();

    res.status(200).json({ success: true, message: 'Repair verified', data: ticket });
  } catch (error) {
    next(error);
  }
};

const closeTicket = async (req, res, next) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    if (ticket.room) await Room.findByIdAndUpdate(ticket.room, { status: 'clean', isBookable: true });

    res.status(200).json({ success: true, message: 'Ticket closed', data: ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard, getTickets, createTicket, assignTicket,
  startWork, completeTicket, verifyTicket, closeTicket,
};