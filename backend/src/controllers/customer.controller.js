const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Folio = require('../models/Folio');
const ServiceRequest = require('../models/ServiceRequest');
const Complaint = require('../models/Complaint');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const { notifyUser, notifyRole } = require('../services/notify');
const emailService = require('../services/email');

// ---------- DASHBOARD ----------
const getDashboard = async (req, res, next) => {
  try {
    const guestId = req.user._id;
    const [upcoming, current, past] = await Promise.all([
      Booking.find({ guest: guestId, status: 'confirmed', checkIn: { $gte: new Date() } }).populate('room', 'roomNumber roomType images'),
      Booking.findOne({ guest: guestId, status: 'checked_in' }).populate('room', 'roomNumber roomType images'),
      Booking.find({ guest: guestId, status: 'checked_out' }),
    ]);

    const totalSpent = past.reduce((s, b) => s + b.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        upcomingStay: upcoming[0] || null,
        currentStay: current,
        pastBookingsCount: past.length,
        totalSpent,
        loyaltyPoints: req.user.loyaltyPoints,
        membershipLevel: req.user.membershipLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- BOOKING ----------
const checkAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut, roomType, guests } = req.query;
    const filter = { isBookable: true };
    if (roomType) filter.roomType = roomType;
    if (guests) filter.maxGuests = { $gte: Number(guests) };

    const allRooms = await Room.find(filter);
    const overlapping = await Booking.find({
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    }).select('room');

    const bookedIds = new Set(overlapping.map((b) => b.room.toString()));
    const availableRooms = allRooms.filter((r) => !bookedIds.has(r._id.toString()));

    res.status(200).json({ success: true, data: availableRooms });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut, guests, specialRequests } = req.body;

    const room = await Room.findById(roomId);
    if (!room) throw new ApiError(404, 'Room not found');
    if (!room.isBookable) throw new ApiError(400, 'Room is not available');

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * room.pricePerNight;

    const booking = await Booking.create({
      guest: req.user._id,
      room: roomId,
      checkIn,
      checkOut,
      guests,
      specialRequests,
      totalAmount,
      source: 'website', // FIXED: 'online' is deprecated; updated to 'website' per BOOKING_SOURCES schema enum
      status: 'pending',
      createdBy: req.user._id,
    });

    const populated = await booking.populate('room', 'roomNumber roomType pricePerNight images');

    // Asynchronous dispatch for notifications and email without blocking response
    Promise.allSettled([
      notifyUser({
        recipientId: req.user._id,
        type: 'booking_created',
        title: 'Booking Request Submitted',
        message: `Your booking request for Room ${populated.room.roomNumber} has been submitted.`,
        link: '/customer/bookings',
        relatedId: booking._id,
      }),
      emailService.sendBookingConfirmation(req.user, booking, room),
      notifyRole({
        role: 'receptionist',
        type: 'new_booking',
        title: 'New Online Booking',
        message: `New booking request for Room ${populated.room.roomNumber}.`,
        link: '/receptionist/reservations',
        relatedId: booking._id,
      }),
    ]).catch((err) => console.error('Error handling booking notifications:', err));

    res.status(201).json({ success: true, message: 'Booking request submitted', data: populated });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate('room', 'roomNumber roomType images pricePerNight')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const cancelMyBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, guest: req.user._id });
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ApiError(400, 'This booking can no longer be cancelled');
    }

    const hoursUntilCheckIn = (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilCheckIn < 24) {
      throw new ApiError(400, 'Cancellations must be made at least 24 hours before check-in');
    }

    booking.status = 'cancelled';
    await booking.save();

    Promise.allSettled([
      emailService.sendCancellationEmail(req.user, booking),
      notifyUser({
        recipientId: req.user._id,
        type: 'cancellation',
        title: 'Booking Cancelled',
        message: `Your booking for ${new Date(booking.checkIn).toLocaleDateString()} has been cancelled.`,
        link: '/customer/bookings',
        relatedId: booking._id,
      }),
    ]).catch((err) => console.error('Error sending cancellation notifications:', err));

    res.status(200).json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    next(error);
  }
};

const modifyMyBooking = async (req, res, next) => {
  try {
    const { checkIn, checkOut, guests } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, guest: req.user._id });
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new ApiError(400, 'This booking can no longer be modified');
    }

    if (checkIn) booking.checkIn = checkIn;
    if (checkOut) booking.checkOut = checkOut;
    if (guests) booking.guests = guests;
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking updated', data: booking });
  } catch (error) {
    next(error);
  }
};

// ---------- INVOICES ----------
const getMyInvoice = async (req, res, next) => {
  try {
    const folio = await Folio.findOne({ booking: req.params.bookingId, guest: req.user._id });
    if (!folio) throw new ApiError(404, 'Invoice not available yet');

    res.status(200).json({ success: true, data: { ...folio.toObject(), totals: folio.getTotals() } });
  } catch (error) {
    next(error);
  }
};

// ---------- SERVICES ----------
const createMyServiceRequest = async (req, res, next) => {
  try {
    const { bookingId, type, details, scheduledTime } = req.body;
    const request = await ServiceRequest.create({
      guest: req.user._id,
      booking: bookingId,
      type,
      details,
      scheduledTime,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Request submitted', data: request });
  } catch (error) {
    next(error);
  }
};

const getMyServiceRequests = async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({ guest: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// ---------- COMPLAINTS ----------
const createComplaint = async (req, res, next) => {
  try {
    const { bookingId, subject, description } = req.body;
    const complaint = await Complaint.create({ guest: req.user._id, booking: bookingId, subject, description });

    // FIXED: Corrected string template interpolation syntax for manager notification message
    notifyRole({
      role: 'hotel_manager',
      type: 'complaint',
      title: 'New Complaint',
      message: `${req.user.firstName} ${req.user.lastName}: ${subject}`,
      link: '/manager/reviews-complaints',
      relatedId: complaint._id,
    }).catch((err) => console.error('Error notifying manager of complaint:', err));

    res.status(201).json({ success: true, message: 'Complaint registered', data: complaint });
  } catch (error) {
    next(error);
  }
};

const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ guest: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    next(error);
  }
};

// ---------- REVIEWS ----------
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment, images } = req.body;
    const review = await Review.create({ guest: req.user._id, booking: bookingId, rating, comment, images });
    res.status(201).json({ success: true, message: 'Thank you for your review!', data: review });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ guest: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, guest: req.user._id },
      { rating, comment },
      { new: true }
    );
    if (!review) throw new ApiError(404, 'Review not found');
    res.status(200).json({ success: true, message: 'Review updated', data: review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, guest: req.user._id });
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

// ---------- PROFILE ----------
const updateMyProfile = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'address', 'dateOfBirth', 'preferences'];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    Object.assign(req.user, updates);
    await req.user.save();

    res.status(200).json({ success: true, message: 'Profile updated', data: req.user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  checkAvailability,
  createBooking,
  getMyBookings,
  cancelMyBooking,
  modifyMyBooking,
  getMyInvoice,
  createMyServiceRequest,
  getMyServiceRequests,
  createComplaint,
  getMyComplaints,
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
  updateMyProfile,
};