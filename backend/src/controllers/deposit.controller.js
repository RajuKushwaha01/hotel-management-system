const Deposit = require('../models/Deposit');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../middleware/auditLogger');

const createDeposit = async (req, res, next) => {
  try {
    const { bookingId, type, amount, method } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');

    const deposit = await Deposit.create({
      booking: bookingId,
      guest: booking.guest,
      type,
      amount,
      method,
      collectedBy: req.user._id,
    });

    booking.advanceCollected += amount;
    booking.paymentStatus = booking.advanceCollected >= booking.totalAmount ? 'paid' : 'partial';
    await booking.save();

    await logAction({
      action: 'DEPOSIT_CREATED',
      module: 'billing',
      req,
      targetType: 'Deposit',
      targetId: deposit._id,
      targetLabel: `Deposit ₹${amount}`,
      description: `Recorded ${type} deposit of ₹${amount} via ${method}`,
      details: { bookingId, amount, method, type },
    });

    res.status(201).json({ success: true, message: 'Deposit recorded', data: deposit });
  } catch (error) {
    next(error);
  }
};

const getDeposits = async (req, res, next) => {
  try {
    const { bookingId, refundStatus } = req.query;
    const filter = {};
    if (bookingId) filter.booking = bookingId;
    if (refundStatus) filter.refundStatus = refundStatus;

    const deposits = await Deposit.find(filter)
      .populate('guest', 'firstName lastName')
      .populate('booking', 'checkIn checkOut room')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: deposits });
  } catch (error) {
    next(error);
  }
};

const requestRefund = async (req, res, next) => {
  try {
    const { refundAmount, refundReason, cancellationFee } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) throw new ApiError(404, 'Deposit not found');

    deposit.refundStatus = 'requested';
    deposit.refundAmount = refundAmount;
    deposit.refundReason = refundReason;
    deposit.cancellationFee = cancellationFee || 0;
    await deposit.save();

    await logAction({
      action: 'REFUND_REQUESTED',
      module: 'billing',
      req,
      targetType: 'Deposit',
      targetId: deposit._id,
      targetLabel: `Refund Request ₹${refundAmount}`,
      description: `Requested refund of ₹${refundAmount} for deposit`,
      details: { refundAmount, refundReason, cancellationFee: deposit.cancellationFee },
    });

    res.status(200).json({ success: true, message: 'Refund requested', data: deposit });
  } catch (error) {
    next(error);
  }
};

const approveRefund = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) throw new ApiError(404, 'Deposit not found');
    if (deposit.refundStatus !== 'requested') throw new ApiError(400, 'Refund must be in requested state to approve');

    deposit.refundStatus = 'approved';
    await deposit.save();

    await logAction({
      action: 'REFUND_APPROVED',
      module: 'billing',
      req,
      targetType: 'Deposit',
      targetId: deposit._id,
      targetLabel: `Refund Approved ₹${deposit.refundAmount}`,
      description: `Approved refund of ₹${deposit.refundAmount}`,
      details: { refundAmount: deposit.refundAmount, refundReason: deposit.refundReason },
    });

    res.status(200).json({ success: true, message: 'Refund approved', data: deposit });
  } catch (error) {
    next(error);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) throw new ApiError(404, 'Deposit not found');
    if (deposit.refundStatus !== 'approved') throw new ApiError(400, 'Refund must be approved before processing');

    deposit.refundStatus = 'processed';
    deposit.refundedBy = req.user._id;
    deposit.refundedAt = new Date();
    await deposit.save();

    // Update booking payment status to reflect the refund
    const booking = await Booking.findById(deposit.booking);
    if (booking) {
      const netPaid = booking.advanceCollected - deposit.refundAmount;
      booking.paymentStatus = deposit.refundAmount >= deposit.amount ? 'refunded' : 'partially_refunded';
      booking.advanceCollected = Math.max(0, netPaid);
      await booking.save();
    }

    await logAction({
      action: 'REFUND_PROCESSED',
      module: 'billing',
      req,
      targetType: 'Deposit',
      targetId: deposit._id,
      targetLabel: `Refund ₹${deposit.refundAmount}`,
      description: `Processed refund of ₹${deposit.refundAmount}`,
      details: { reason: deposit.refundReason },
    });

    res.status(200).json({ success: true, message: 'Refund processed', data: deposit });
  } catch (error) {
    next(error);
  }
};

const rejectRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) throw new ApiError(404, 'Deposit not found');

    deposit.refundStatus = 'rejected';
    deposit.refundReason = reason;
    await deposit.save();

    await logAction({
      action: 'REFUND_REJECTED',
      module: 'billing',
      req,
      targetType: 'Deposit',
      targetId: deposit._id,
      targetLabel: `Refund Rejected`,
      description: `Rejected refund request for deposit`,
      details: { rejectionReason: reason },
    });

    res.status(200).json({ success: true, message: 'Refund rejected', data: deposit });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDeposit, getDeposits, requestRefund, approveRefund, processRefund, rejectRefund }; 