const Room = require('../models/Room');
const Review = require('../models/Review');

const getPublicRooms = async (req, res, next) => {
  try {
    const { roomType, minPrice, maxPrice, guests, sort } = req.query;
    const filter = { isBookable: true };
    if (roomType) filter.roomType = roomType;
    if (guests) filter.maxGuests = { $gte: Number(guests) };
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { pricePerNight: 1 };
    if (sort === 'price_desc') sortOption = { pricePerNight: -1 };

    const rooms = await Room.find(filter).sort(sortOption);
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

const getPublicRoomDetails = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const similarRooms = await Room.find({ roomType: room.roomType, _id: { $ne: room._id }, isBookable: true }).limit(3);
    const reviews = await Review.find({ isPublished: true }).populate('guest', 'firstName lastName').sort({ createdAt: -1 }).limit(10);

    res.status(200).json({ success: true, data: { room, similarRooms, reviews } });
  } catch (error) {
    next(error);
  }
};

const getPublicReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isPublished: true })
      .populate('guest', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicRooms, getPublicRoomDetails, getPublicReviews };