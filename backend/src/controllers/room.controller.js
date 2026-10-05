const Room = require('../models/Room');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const { logAction, buildChanges } = require('../middleware/auditLogger');
const { broadcastRoomStatus } = require('../services/roomStatusBroadcast');

const getAllRooms = async (req, res, next) => {
  try {
    const { roomType, status, floor, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (roomType) filter.roomType = roomType;
    if (status) filter.status = status;
    if (floor) filter.floor = Number(floor);

    const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Room.countDocuments(filter);

    res.status(200).json({ success: true, data: rooms, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) throw new ApiError(404, 'Room not found');
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { roomNumber } = req.body;
    const existing = await Room.findOne({ roomNumber });
    if (existing) throw new ApiError(400, 'A room with this number already exists');

    const room = await Room.create(req.body);
    res.status(201).json({ success: true, message: 'Room created', data: room });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const before = await Room.findById(req.params.id);
    if (!before) throw new ApiError(404, 'Room not found');

    const { oldValue, newValue, changed } = buildChanges(before.toObject(), req.body, Object.keys(req.body));

    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (changed) {
      const description = newValue.pricePerNight !== undefined
        ? `Changed Room ${room.roomNumber} price ₹${oldValue.pricePerNight} → ₹${newValue.pricePerNight}`
        : `Updated Room ${room.roomNumber} (${Object.keys(newValue).join(', ')})`;

      await logAction({
        action: 'ROOM_UPDATED', module: 'rooms', req,
        targetType: 'Room', targetId: room._id, targetLabel: `Room ${room.roomNumber}`,
        description, oldValue, newValue,
      });
    }

    res.status(200).json({ success: true, message: 'Room updated', data: room });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const activeBooking = await Booking.findOne({ room: req.params.id, status: { $in: ['confirmed', 'checked_in'] } });
    if (activeBooking) throw new ApiError(400, 'Cannot delete a room with active bookings');

    await Room.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Room deleted' });
  } catch (error) {
    next(error);
  }
};

const updateRoomStatus = async (req, res, next) => {
  try {
    const { status, blockedReason, blockedUntil } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) throw new ApiError(404, 'Room not found');

    room.status = status;
    room.isBookable = ['available'].includes(status);
    if (status === 'blocked') {
      room.blockedReason = blockedReason;
      room.blockedUntil = blockedUntil;
    } else {
      room.blockedReason = undefined;
      room.blockedUntil = undefined;
    }
    await room.save();

    broadcastRoomStatus(room);

    res.status(200).json({ success: true, message: 'Room status updated', data: room });
  } catch (error) {
    next(error);
  }
};

// Room type distribution + status summary for the Room Management dashboard
const getRoomOverview = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    const byType = {};
    const byStatus = {};

    rooms.forEach((r) => {
      byType[r.roomType] = (byType[r.roomType] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    res.status(200).json({ success: true, data: { total: rooms.length, byType, byStatus } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom, updateRoomStatus, getRoomOverview };