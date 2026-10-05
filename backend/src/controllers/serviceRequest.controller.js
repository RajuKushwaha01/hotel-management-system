const ServiceRequest = require('../models/ServiceRequest');
const ApiError = require('../utils/ApiError');

const createServiceRequest = async (req, res, next) => {
  try {
    const { guestId, bookingId, type, details, scheduledTime } = req.body;

    const request = await ServiceRequest.create({
      guest: guestId,
      booking: bookingId,
      type,
      details,
      scheduledTime,
      createdBy: req.user._id,
    });

    const populated = await request.populate('guest', 'firstName lastName phone');

    res.status(201).json({ success: true, message: 'Request logged', data: populated });
  } catch (error) {
    next(error);
  }
};

const getServiceRequests = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const requests = await ServiceRequest.find(filter)
      .populate('guest', 'firstName lastName phone')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ServiceRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const updateServiceRequestStatus = async (req, res, next) => {
  try {
    const { status, resolutionNote, assignedTo } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) throw new ApiError(404, 'Request not found');

    if (status) request.status = status;
    if (resolutionNote !== undefined) request.resolutionNote = resolutionNote;
    if (assignedTo) request.assignedTo = assignedTo;

    await request.save();
    res.status(200).json({ success: true, message: 'Request updated', data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = { createServiceRequest, getServiceRequests, updateServiceRequestStatus };