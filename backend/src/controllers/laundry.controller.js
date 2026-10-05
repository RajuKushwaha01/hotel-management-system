const LaundryRequest = require('../models/LaundryRequest');
const Folio = require('../models/Folio');
const ApiError = require('../utils/ApiError');

const createLaundryRequest = async (req, res, next) => {
  try {
    const { guestId, bookingId, roomNumber, items, serviceType } = req.body;

    const request = new LaundryRequest({ guest: guestId, booking: bookingId, roomNumber, items, serviceType });
    request.calculateTotal();
    await request.save();

    res.status(201).json({ success: true, message: 'Laundry request created', data: request });
  } catch (error) {
    next(error);
  }
};

const getLaundryRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await LaundryRequest.find(filter)
      .populate('guest', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

const updateLaundryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await LaundryRequest.findById(req.params.id);
    if (!request) throw new ApiError(404, 'Request not found');

    request.status = status;
    if (status === 'picked_up') request.pickedUpAt = new Date();
    if (status === 'ready') request.readyAt = new Date();
    if (status === 'delivered') {
      request.deliveredAt = new Date();
      // Delivered laundry gets charged to the guest folio automatically
      await Folio.findOneAndUpdate(
        { booking: request.booking },
        {
          $push: {
            charges: {
              type: 'laundry',
              description: `Laundry service — ${request.items.length} item(s)`,
              amount: request.totalPrice,
              addedBy: req.user._id,
            },
          },
        }
      );
    }
    await request.save();

    res.status(200).json({ success: true, message: 'Status updated', data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLaundryRequest, getLaundryRequests, updateLaundryStatus };