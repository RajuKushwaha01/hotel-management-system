const TransportRequest = require('../models/TransportRequest');
const Folio = require('../models/Folio');
const ApiError = require('../utils/ApiError');

const createTransportRequest = async (req, res, next) => {
  try {
    const request = await TransportRequest.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Transport request created', data: request });
  } catch (error) {
    next(error);
  }
};

const getTransportRequests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await TransportRequest.find(filter)
      .populate('guest', 'firstName lastName phone')
      .sort({ scheduledDateTime: 1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

const assignDriver = async (req, res, next) => {
  try {
    const { vehicle, driverName, driverPhone, cost } = req.body;
    const request = await TransportRequest.findByIdAndUpdate(
      req.params.id,
      { vehicle, driverName, driverPhone, cost, status: 'assigned' },
      { new: true }
    );
    if (!request) throw new ApiError(404, 'Request not found');

    res.status(200).json({ success: true, message: 'Driver assigned', data: request });
  } catch (error) {
    next(error);
  }
};

const updateTransportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await TransportRequest.findById(req.params.id);
    if (!request) throw new ApiError(404, 'Request not found');

    request.status = status;
    await request.save();

    if (status === 'completed' && request.chargeToFolio && request.booking) {
      await Folio.findOneAndUpdate(
        { booking: request.booking },
        {
          $push: {
            charges: {
              type: 'transport',
              description: `${request.type.replace(/_/g, ' ')} — ${request.pickupLocation} to ${request.dropLocation}`,
              amount: request.cost,
              addedBy: req.user._id,
            },
          },
        }
      );
    }

    res.status(200).json({ success: true, message: 'Status updated', data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTransportRequest, getTransportRequests, assignDriver, updateTransportStatus };