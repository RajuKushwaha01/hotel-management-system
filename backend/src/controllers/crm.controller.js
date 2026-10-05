const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const ApiError = require('../utils/ApiError');

// ---------- GUEST 360 PROFILE ----------
const getGuestCRMProfile = async (req, res, next) => {
  try {
    const guest = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!guest) throw new ApiError(404, 'Guest not found');

    const [bookings, reviews, complaints] = await Promise.all([
      Booking.find({ guest: guest._id })
        .populate('room', 'roomNumber roomType')
        .sort({ createdAt: -1 }),
      Review.find({ guest: guest._id }).sort({ createdAt: -1 }),
      Complaint.find({ guest: guest._id }).sort({ createdAt: -1 }),
    ]);

    // FIXED: Removed obsolete 'completed' enum filter and aligned to 'checked_out'
    const completedStays = bookings.filter((b) => b.status === 'checked_out');
    const totalSpent = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((s, b) => s + (b.totalAmount || 0), 0);
    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.status(200).json({
      success: true,
      data: {
        guest: guest.toSafeObject(),
        bookings,
        reviews,
        complaints,
        summary: {
          totalBookings: bookings.length,
          completedStays: completedStays.length,
          totalSpent,
          avgRating,
          isFrequentGuest: completedStays.length >= 3,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- FREQUENT GUESTS LIST ----------
const getFrequentGuests = async (req, res, next) => {
  try {
    // FIXED: Dropped obsolete 'completed' enum and replaced N+1 loop with single aggregation pipeline
    const frequentGuests = await Booking.aggregate([
      { $match: { status: 'checked_out' } },
      {
        $group: {
          _id: '$guest',
          completedStays: { $sum: 1 },
        },
      },
      { $match: { completedStays: { $gte: 3 } } },
      { $sort: { completedStays: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'guestInfo',
        },
      },
      { $unwind: '$guestInfo' },
      { $match: { 'guestInfo.role': 'customer' } },
      {
        $project: {
          _id: 0,
          completedStays: 1,
          guest: {
            _id: '$guestInfo._id',
            firstName: '$guestInfo.firstName',
            lastName: '$guestInfo.lastName',
            email: '$guestInfo.email',
            phone: '$guestInfo.phone',
            loyaltyPoints: '$guestInfo.loyaltyPoints',
            membershipLevel: '$guestInfo.membershipLevel',
          },
        },
      },
    ]);

    res.status(200).json({ success: true, data: frequentGuests });
  } catch (error) {
    next(error);
  }
};

// ---------- UPCOMING BIRTHDAYS & ANNIVERSARIES (within next 30 days) ----------
const getUpcomingOccasions = async (req, res, next) => {
  try {
    const guests = await User.find({
      role: 'customer',
      dateOfBirth: { $exists: true, $ne: null },
    });
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const upcoming = guests
      .map((g) => {
        const dob = new Date(g.dateOfBirth);
        const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
        return {
          guest: {
            _id: g._id,
            firstName: g.firstName,
            lastName: g.lastName,
            email: g.email,
            phone: g.phone,
          },
          occasion: 'Birthday',
          date: nextBirthday,
        };
      })
      .filter((item) => item.date <= in30Days)
      .sort((a, b) => a.date - b.date);

    res.status(200).json({ success: true, data: upcoming });
  } catch (error) {
    next(error);
  }
};

// ---------- CRM DASHBOARD ----------
const getCRMDashboard = async (req, res, next) => {
  try {
    const [totalGuests, openComplaints, avgRatingAgg] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Complaint.countDocuments({ status: { $in: ['open', 'assigned', 'in_progress'] } }),
      Review.aggregate([
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalGuests,
        openComplaints,
        avgRating: avgRatingAgg[0]?.avg ? Number(avgRatingAgg[0].avg.toFixed(1)) : 0,
        totalReviews: avgRatingAgg[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGuestCRMProfile,
  getFrequentGuests,
  getUpcomingOccasions,
  getCRMDashboard,
};