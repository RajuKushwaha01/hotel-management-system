const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const Folio = require('../models/Folio');
const ApiError = require('../utils/ApiError');
const { notifyUser, notifyRole } = require('../services/notify');
const emailService = require('../services/email');
const { awardPointsForStay } = require('./loyalty.controller');
const { broadcastRoomStatus } = require('../services/roomStatusBroadcast');

// ---------- FRONT DESK DASHBOARD ----------
const getDashboard = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      arrivalsToday,
      departuresToday,
      expectedGuests,
      availableRooms,
      occupiedRooms,
      dirtyRooms,
      pendingPayments,
    ] = await Promise.all([
      Booking.find({ checkIn: { $gte: startOfDay,$lte: endOfDay }, status: 'confirmed' })
        .populate('guest', 'firstName lastName phone')
        .populate('room', 'roomNumber roomType'),
      Booking.find({ checkOut: { $gte: startOfDay,$lte: endOfDay }, status: 'checked_in' })
        .populate('guest', 'firstName lastName phone')
        .populate('room', 'roomNumber roomType'),
      Booking.countDocuments({
        checkIn: { $gte: startOfDay,$lte: endOfDay },
        status: { $in: ['pending', 'confirmed'] },
      }),
      Room.countDocuments({ status: 'clean', isBookable: true }),
      Room.countDocuments({ status: { $in: ['dirty', 'cleaning'] } }),
      Room.countDocuments({ status: 'dirty' }),
      Booking.countDocuments({ paymentStatus: { $ne: 'paid' }, status: {$ne: 'cancelled' } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        arrivalsToday,
        departuresToday,
        expectedGuests,
        availableRooms,
        occupiedRooms,
        dirtyRooms,
        pendingPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- AVAILABILITY ----------
const checkAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut, roomType } = req.query;
    if (!checkIn || !checkOut) throw new ApiError(400, 'checkIn and checkOut are required');

    const roomFilter = { isBookable: true };
    if (roomType) roomFilter.roomType = roomType;

    const allRooms = await Room.find(roomFilter);

    const overlapping = await Booking.find({
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    }).select('room');

    const bookedRoomIds = new Set(overlapping.map((b) => b.room.toString()));
    const availableRooms = allRooms.filter((r) => !bookedRoomIds.has(r._id.toString()));

    res.status(200).json({ success: true, data: availableRooms });
  } catch (error) {
    next(error);
  }
};

// ---------- RESERVATIONS ----------
const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      guestId,
      newGuest,
      roomId,
      checkIn,
      checkOut,
      guests,
      specialRequests,
      source,
      totalAmount,
      additionalGuests,
      groupBookingId,
    } = req.body;

    let guestUserId = guestId;

    if (!guestUserId && newGuest) {
      const existing = await User.findOne({ email: newGuest.email }).session(session);
      if (existing) {
        guestUserId = existing._id;
      } else {
        const tempPassword = Math.random().toString(36).slice(-10);
        const [created] = await User.create(
          [
            {
              ...newGuest,
              password: tempPassword,
              role: 'customer',
              isWalkIn: true,
            },
          ],
          { session }
        );
        guestUserId = created._id;
      }
    }

    if (!guestUserId) throw new ApiError(400, 'Guest information is required');

    const room = await Room.findById(roomId).session(session);
    if (!room) throw new ApiError(404, 'Room not found');
    if (!room.isBookable) throw new ApiError(400, 'Room is not available for booking');

    // Double-booking check within transaction
    const overlapping = await Booking.findOne({
      room: roomId,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    }).session(session);

    if (overlapping) {
      throw new ApiError(400, 'Room is already booked for the selected dates');
    }

    const [booking] = await Booking.create(
      [
        {
          guest: guestUserId,
          room: roomId,
          checkIn,
          checkOut,
          guests: guests || 1,
          additionalGuests: additionalGuests || [],
          specialRequests,
          source: source || 'walk_in',
          totalAmount,
          status: 'confirmed',
          createdBy: req.user._id,
          groupBookingId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populated = await Booking.findById(booking._id).populate([
      { path: 'guest', select: 'firstName lastName email phone' },
      { path: 'room', select: 'roomNumber roomType pricePerNight' },
    ]);

    // Dispatch async notifications out-of-band
    Promise.allSettled([
      emailService.sendBookingConfirmation(populated.guest, populated, populated.room),
      notifyUser({
        recipientId: guestUserId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your reservation for Room ${populated.room.roomNumber} is confirmed.`,
        link: '/customer/bookings',
        relatedId: booking._id,
      }),
      notifyRole({
        role: 'hotel_manager',
        type: 'new_booking',
        title: 'New Booking',
        message: `${populated.guest.firstName} ${populated.guest.lastName} booked Room ${populated.room.roomNumber}.`,
        link: '/manager/reservations',
      }),
    ]).catch((err) => console.error('Error handling post-booking notifications:', err));

    res.status(201).json({ success: true, message: 'Booking created', data: populated });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

const searchBookings = async (req, res, next) => {
  try {
    const { query, status, from, to, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));

    const pipeline = [];
    const matchStage = {};

    if (status) matchStage.status = status;
    if (from && to) {
      matchStage.checkIn = { $gte: new Date(from),$lte: new Date(to) };
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'guest',
          foreignField: '_id',
          as: 'guest',
        },
      },
      { $unwind: { path: '$guest', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'room',
        },
      },
      { $unwind: { path: '$room', preserveNullAndEmptyArrays: true } }
    );

    if (query) {
      const regex = new RegExp(query, 'i');
      const isObjectId = mongoose.Types.ObjectId.isValid(query);

      const orConditions = [
        { 'guest.firstName': regex },
        { 'guest.lastName': regex },
        { 'guest.email': regex },
        { 'guest.phone': regex },
        { 'room.roomNumber': regex },
      ];

      if (isObjectId) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(query) });
      }

      pipeline.push({ $match: {$or: orConditions } });
    }

    pipeline.push({
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },           {$skip: (pageNum - 1) * limitNum },
          { $limit: limitNum },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [result] = await Booking.aggregate(pipeline);
    const bookings = result ? result.data : [];
    const total = result && result.totalCount[0] ? result.totalCount[0].count : 0;

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCalendar = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { status: { $in: ['confirmed', 'checked_in'] } };
    if (from && to) {
      filter.checkIn = { $lte: new Date(to) };
      filter.checkOut = { $gte: new Date(from) };
    }

    const bookings = await Booking.find(filter)
      .populate('guest', 'firstName lastName')
      .populate('room', 'roomNumber roomType');

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const modifyBooking = async (req, res, next) => {
  try {
    const { checkIn, checkOut, guests, specialRequests, totalAmount } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (['checked_in', 'checked_out', 'cancelled'].includes(booking.status)) {
   throw new ApiError(400, `Cannot modify a booking that is ${booking.status}`);
   }

    if (checkIn) booking.checkIn = checkIn;
    if (checkOut) booking.checkOut = checkOut;
    if (guests) booking.guests = guests;
    if (specialRequests !== undefined) booking.specialRequests = specialRequests;
    if (totalAmount) booking.totalAmount = totalAmount;

    await booking.save();
    res.status(200).json({ success: true, message: 'Booking updated', data: booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    next(error);
  }
};

// ---------- CHECK-IN ----------
const checkInGuest = async (req, res, next) => {
  try {
    const { advanceAmount, advanceMethod, idNumber, idType } = req.body;
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'confirmed') {
      throw new ApiError(
        400,
        `Booking must be confirmed before check-in (current: ${booking.status})`
      );
    }

    if (idNumber || idType) {
      await User.findByIdAndUpdate(booking.guest, {
        ...(idNumber && { idNumber }),
        ...(idType && { idType }),
      });
    }

    booking.status = 'checked_in';
    booking.actualCheckInTime = new Date();
    if (advanceAmount) {
      booking.advanceCollected += Number(advanceAmount);
      booking.paymentStatus =
        booking.advanceCollected >= booking.totalAmount ? 'paid' : 'partial';
    }
    await booking.save();

    const updatedRoom = await Room.findByIdAndUpdate(
      booking.room._id,
      { status: 'clean' },
      { new: true }
    );
    broadcastRoomStatus(updatedRoom);

    const nights = Math.max(
      1,
      Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))
    );
    const folio = await Folio.create({
      booking: booking._id,
      guest: booking.guest,
      charges: [
        {
          type: 'room',
          description: `Room ${booking.room.roomNumber} × ${nights} night(s)`,
          amount: booking.totalAmount,
          addedBy: req.user._id,
        },
      ],
      payments: advanceAmount
        ? [
            {
              amount: Number(advanceAmount),
              method: advanceMethod || 'cash',
              note: 'Advance at check-in',
              collectedBy: req.user._id,
            },
          ]
        : [],
    });

    const guestUser = await User.findById(booking.guest);
    if (guestUser) {
      emailService.sendCheckinConfirmation(guestUser, booking.room).catch(console.error);
    }

    res.status(200).json({
      success: true,
      message: 'Guest checked in successfully',
      data: { booking, folio },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- DURING STAY ----------
const changeRoom = async (req, res, next) => {
  try {
    const { newRoomId, reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'checked_in')
      throw new ApiError(400, 'Guest must be checked in to change rooms');

    const newRoom = await Room.findById(newRoomId);
    if (!newRoom || !newRoom.isBookable)
      throw new ApiError(400, 'Selected room is unavailable');

    booking.roomHistory.push({
      room: booking.room,
      reason: reason || 'Guest requested room change',
    });
    booking.room = newRoomId;
    await booking.save();

    res.status(200).json({ success: true, message: 'Room changed', data: booking });
  } catch (error) {
    next(error);
  }
};

const extendStay = async (req, res, next) => {
  try {
    const { newCheckOut, additionalAmount } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'checked_in')
      throw new ApiError(400, 'Guest must be checked in to extend stay');
    if (new Date(newCheckOut) <= new Date(booking.checkOut)) {
      throw new ApiError(400, 'New check-out date must be after the current one');
    }

    if (!booking.originalCheckOut) booking.originalCheckOut = booking.checkOut;
    booking.checkOut = newCheckOut;
    if (additionalAmount) booking.totalAmount += Number(additionalAmount);
    await booking.save();

    if (additionalAmount) {
      await Folio.findOneAndUpdate(
        { booking: booking._id },
        {
          $push: {
            charges: {
              type: 'room',
              description: 'Stay extension',
              amount: Number(additionalAmount),
              addedBy: req.user._id,
            },
          },
        }
      );
    }

    res.status(200).json({ success: true, message: 'Stay extended', data: booking });
  } catch (error) {
    next(error);
  }
};

const addAdditionalGuest = async (req, res, next) => {
  try {
    const { name, age } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    booking.additionalGuests.push({ name, age });
    booking.guests += 1;
    await booking.save();

    res.status(200).json({ success: true, message: 'Guest added', data: booking });
  } catch (error) {
    next(error);
  }
};

// ---------- FOLIO & CHECK-OUT ----------
const getFolio = async (req, res, next) => {
  try {
    const folio = await Folio.findOne({ booking: req.params.id })
      .populate('guest', 'firstName lastName')
      .populate('charges.addedBy', 'firstName lastName')
      .populate('payments.collectedBy', 'firstName lastName');
    if (!folio) throw new ApiError(404, 'Folio not found for this booking');

    res
      .status(200)
      .json({ success: true, data: { ...folio.toObject(), totals: folio.getTotals() } });
  } catch (error) {
    next(error);
  }
};

const addCharge = async (req, res, next) => {
  try {
    const { type, description, amount } = req.body;
    const folio = await Folio.findOne({ booking: req.params.id });
    if (!folio) throw new ApiError(404, 'Folio not found');

    folio.charges.push({ type, description, amount, addedBy: req.user._id });
    await folio.save();

    res.status(200).json({
      success: true,
      message: 'Charge added',
      data: { ...folio.toObject(), totals: folio.getTotals() },
    });
  } catch (error) {
    next(error);
  }
};

const collectPayment = async (req, res, next) => {
  try {
    const { amount, method, note } = req.body;
    const folio = await Folio.findOne({ booking: req.params.id });
    if (!folio) throw new ApiError(404, 'Folio not found');

    folio.payments.push({ amount, method, note, collectedBy: req.user._id });
    await folio.save();

    const totals = folio.getTotals();
    const booking = await Booking.findById(req.params.id);
    booking.paymentStatus = totals.balance <= 0 ? 'paid' : 'partial';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment collected',
      data: { ...folio.toObject(), totals },
    });
  } catch (error) {
    next(error);
  }
};

const checkOutGuest = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'checked_in')
      throw new ApiError(400, 'Guest is not currently checked in');

    const folio = await Folio.findOne({ booking: booking._id });
    const totals = folio ? folio.getTotals() : { balance: 0 };

    if (totals.balance > 0) {
      throw new ApiError(
        400,
        `Outstanding balance of ₹${totals.balance} must be settled before check-out`
      );
    }

      booking.status = 'checked_out';
    booking.actualCheckOutTime = new Date();
    booking.paymentStatus = 'paid';
    await booking.save();

    await awardPointsForStay({
      guestId: booking.guest,
      bookingId: booking._id,
      amountSpent: booking.totalAmount,
    });

    if (folio) {
      folio.isClosed = true;
      if (!folio.verificationCode) folio.verificationCode = crypto.randomBytes(8).toString('hex');
      await folio.save();
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      booking.room._id,
      { status: 'dirty' },
      { new: true }
    );
    broadcastRoomStatus(updatedRoom);

    const guestUser = await User.findById(booking.guest);

    // Run async side-effects independently
    Promise.allSettled([
      emailService.sendInvoiceEmail(guestUser, folio ? folio.getBreakdown() : {}),
      emailService.sendCheckoutReceipt(guestUser, booking),
      notifyUser({
        recipientId: booking.guest,
        type: 'invoice_generated',
        title: 'Invoice Ready',
        message: 'Your final invoice is now available to view and download.',
        link: '/customer/invoices',
      }),
      notifyRole({
        role: 'housekeeping',
        type: 'cleaning_assignment',
        title: 'Room Needs Cleaning',
        message: `Room ${booking.room.roomNumber} is now dirty and needs cleaning.`,
        link: '/housekeeping/dashboard',
      }),
    ]).catch((err) => console.error('Error in post checkout tasks:', err));

    res
      .status(200)
      .json({ success: true, message: 'Guest checked out successfully', data: booking });
  } catch (error) {
    next(error);
  }
};

// ---------- RESERVATION CALENDAR (grid view) ----------
const getReservationCalendar = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date(new Date().setDate(start.getDate() + 30));

    const rooms = await Room.find().sort({ floor: 1, roomNumber: 1 });
    const bookings = await Booking.find({
      status: { $in: ['confirmed', 'checked_in'] },
      checkIn: { $lte: end },
      checkOut: { $gte: start },
    })
      .populate('guest', 'firstName lastName')
      .populate('room', 'roomNumber');

    const grid = rooms.map((room) => ({
      room: { _id: room._id, roomNumber: room.roomNumber, roomType: room.roomType },
      bookings: bookings
        .filter((b) => b.room?._id?.toString() === room._id.toString())
        .map((b) => ({
          bookingId: b._id,
          guestName: `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
        })),
    }));

    res.status(200).json({ success: true, data: { from: start, to: end, grid } });
  } catch (error) {
    next(error);
  }
};

// ---------- MULTI-ROOM / GROUP BOOKING ----------
const createGroupBooking = async (req, res, next) => {
  try {
    const { guestId, newGuest, roomIds, checkIn, checkOut, specialRequests, source } = req.body;

    let guestUserId = guestId;
    if (!guestUserId && newGuest) {
      const existing = await User.findOne({ email: newGuest.email });
      guestUserId = existing
        ? existing._id
        : (
            await User.create({
              ...newGuest,
              password: Math.random().toString(36).slice(-10),
              role: 'customer',
              isWalkIn: true,
            })
          )._id;
    }
    if (!guestUserId) throw new ApiError(400, 'Guest information is required');

    const rooms = await Room.find({ _id: { $in: roomIds }, isBookable: true });
    if (rooms.length !== roomIds.length)
      throw new ApiError(400, 'One or more selected rooms are unavailable');

    const groupBookingId = `GRP-${Date.now()}`;
    const nights = Math.max(
      1,
      Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    );

    const bookings = await Promise.all(
      rooms.map((room) =>
        Booking.create({
          guest: guestUserId,
          room: room._id,
          rooms: [{ room: room._id, rateApplied: room.pricePerNight }],
          checkIn,
          checkOut,
          guests: 1,
          totalAmount: nights * room.pricePerNight,
          source: source || 'reception',
          status: 'confirmed',
          specialRequests,
          groupBookingId,
          createdBy: req.user._id,
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Group booking created for ${bookings.length} rooms`,
      data: bookings,
      groupBookingId,
    });
  } catch (error) {
    next(error);
  }
};

// ---------- RESCHEDULE ----------
const rescheduleBooking = async (req, res, next) => {
  try {
    const { newCheckIn, newCheckOut, reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ApiError(400, 'Only pending or confirmed bookings can be rescheduled');
    }

    const overlap = await Booking.findOne({
      _id: { $ne: booking._id },
      room: booking.room,
      status: { $in: ['confirmed', 'checked_in'] },
      checkIn: { $lt: new Date(newCheckOut) },
      checkOut: { $gt: new Date(newCheckIn) },
    });
    if (overlap) throw new ApiError(400, 'Room is not available for the new dates');

    booking.rescheduleHistory.push({
      oldCheckIn: booking.checkIn,
      oldCheckOut: booking.checkOut,
      newCheckIn,
      newCheckOut,
      reason,
    });
    booking.checkIn = newCheckIn;
    booking.checkOut = newCheckOut;
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking rescheduled', data: booking });
  } catch (error) {
    next(error);
  }
};

// ---------- NO-SHOW ----------
const markNoShow = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'confirmed')
      throw new ApiError(400, 'Only confirmed bookings can be marked as no-show');

    booking.status = 'no_show';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking marked as no-show', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  checkAvailability,
  createBooking,
  searchBookings,
  getCalendar,
  modifyBooking,
  cancelBooking,
  checkInGuest,
  changeRoom,
  extendStay,
  addAdditionalGuest,
  getFolio,
  addCharge,
  collectPayment,
  checkOutGuest,
  getReservationCalendar,
  createGroupBooking,
  rescheduleBooking,
  markNoShow,
};