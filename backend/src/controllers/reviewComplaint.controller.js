const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const ApiError = require('../utils/ApiError');

// ---------- REVIEWS (manager view) ----------
const getAllReviews = async (req, res, next) => {
  try {
    const { minRating, maxRating } = req.query;
    const filter = {};
    if (minRating) filter.rating = { ...filter.rating, $gte: Number(minRating) };
    if (maxRating) filter.rating = { ...filter.rating, $lte: Number(maxRating) };

    const reviews = await Review.find(filter).populate('guest', 'firstName lastName email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const respondToReview = async (req, res, next) => {
  try {
    const { managerResponse } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { managerResponse, respondedBy: req.user._id, respondedAt: new Date() },
      { new: true }
    );
    if (!review) throw new ApiError(404, 'Review not found');

    res.status(200).json({ success: true, message: 'Response posted', data: review });
  } catch (error) {
    next(error);
  }
};

const togglePublishReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, 'Review not found');

    review.isPublished = !review.isPublished;
    await review.save();

    res.status(200).json({ success: true, message: `Review ${review.isPublished ? 'published' : 'hidden'}`, data: review });
  } catch (error) {
    next(error);
  }
};

// ---------- COMPLAINTS (manager view) ----------
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, assignedTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const complaints = await Complaint.find(filter)
      .populate('guest', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    next(error);
  }
};

const assignComplaint = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo, assignedBy: req.user._id, status: 'assigned' },
      { new: true }
    ).populate('assignedTo', 'firstName lastName role');
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    res.status(200).json({ success: true, message: 'Complaint assigned', data: complaint });
  } catch (error) {
    next(error);
  }
};

const respondToComplaint = async (req, res, next) => {
  try {
    const { response } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    complaint.response = response;
    complaint.respondedAt = new Date();
    if (complaint.status === 'assigned') complaint.status = 'in_progress';
    await complaint.save();

    res.status(200).json({ success: true, message: 'Response sent', data: complaint });
  } catch (error) {
    next(error);
  }
};

const resolveComplaint = async (req, res, next) => {
  try {
    const { resolutionNote } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    complaint.status = 'resolved';
    complaint.resolutionNote = resolutionNote;
    complaint.resolvedAt = new Date();
    await complaint.save();

    res.status(200).json({ success: true, message: 'Complaint resolved', data: complaint });
  } catch (error) {
    next(error);
  }
};

const closeComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: 'closed', closedAt: new Date() }, { new: true });
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    res.status(200).json({ success: true, message: 'Complaint closed', data: complaint });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReviews, respondToReview, togglePublishReview,
  getAllComplaints, assignComplaint, respondToComplaint, resolveComplaint, closeComplaint,
};