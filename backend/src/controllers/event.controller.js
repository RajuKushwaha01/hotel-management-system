const Hall = require('../models/Hall');
const EventBooking = require('../models/EventBooking');
const ApiError = require('../utils/ApiError');

// ---------- HALLS ----------
const getHalls = async (req, res, next) => {
  try {
    const halls = await Hall.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: halls });
  } catch (error) {
    next(error);
  }
};

const createHall = async (req, res, next) => {
  try {
    const hall = await Hall.create(req.body);
    res.status(201).json({ success: true, message: 'Hall added', data: hall });
  } catch (error) {
    next(error);
  }
};

const updateHall = async (req, res, next) => {
  try {
    const hall = await Hall.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hall) throw new ApiError(404, 'Hall not found');
    res.status(200).json({ success: true, message: 'Hall updated', data: hall });
  } catch (error) {
    next(error);
  }
};

// ---------- AVAILABILITY ----------
const checkHallAvailability = async (req, res, next) => {
  try {
    const { hallId, eventDate } = req.query;
    const conflict = await EventBooking.findOne({
      hall: hallId,
      eventDate: new Date(eventDate),
      status: { $in: ['inquiry', 'confirmed', 'in_progress'] },
    });

    res.status(200).json({ success: true, data: { available: !conflict, conflictingEvent: conflict } });
  } catch (error) {
    next(error);
  }
};

// ---------- EVENT BOOKINGS ----------
const createEventBooking = async (req, res, next) => {
  try {
    const { hallId, eventDate } = req.body;

    const conflict = await EventBooking.findOne({
      hall: hallId, eventDate: new Date(eventDate),
      status: { $in: ['inquiry', 'confirmed', 'in_progress'] },
    });
    if (conflict) throw new ApiError(400, 'This hall is already booked for the selected date');

    const hall = await Hall.findById(hallId);
    if (!hall) throw new ApiError(404, 'Hall not found');

    const event = new EventBooking({ ...req.body, hall: hallId, hallCost: hall.pricePerDay, createdBy: req.user._id });
    event.calculateTotal();
    await event.save();

    const populated = await event.populate('hall', 'name type capacity');
    res.status(201).json({ success: true, message: 'Event booking created', data: populated });
  } catch (error) {
    next(error);
  }
};

const getEventBookings = async (req, res, next) => {
  try {
    const { status, eventType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;

    const events = await EventBooking.find(filter).populate('hall', 'name type capacity').sort({ eventDate: 1 });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const updateEventBooking = async (req, res, next) => {
  try {
    const event = await EventBooking.findById(req.params.id);
    if (!event) throw new ApiError(404, 'Event booking not found');

    Object.assign(event, req.body);
    event.calculateTotal();
    await event.save();

    res.status(200).json({ success: true, message: 'Event updated', data: event });
  } catch (error) {
    next(error);
  }
};

const collectEventAdvance = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const event = await EventBooking.findById(req.params.id);
    if (!event) throw new ApiError(404, 'Event booking not found');

    event.advancePayment += amount;
    if (event.status === 'inquiry') event.status = 'confirmed';
    await event.save();

    res.status(200).json({ success: true, message: 'Advance payment recorded', data: event });
  } catch (error) {
    next(error);
  }
};

const updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const event = await EventBooking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!event) throw new ApiError(404, 'Event booking not found');

    res.status(200).json({ success: true, message: 'Status updated', data: event });
  } catch (error) {
    next(error);
  }
};

// Final invoice = totalCost - advancePayment
const getEventInvoice = async (req, res, next) => {
  try {
    const event = await EventBooking.findById(req.params.id).populate('hall', 'name type');
    if (!event) throw new ApiError(404, 'Event booking not found');

    res.status(200).json({
      success: true,
      data: {
        event,
        balanceDue: event.totalCost - event.advancePayment,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHalls, createHall, updateHall, checkHallAvailability,
  createEventBooking, getEventBookings, updateEventBooking,
  collectEventAdvance, updateEventStatus, getEventInvoice,
};