const Folio = require('../models/Folio');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { notifyUser } = require('../services/notify');
const emailService = require('../services/email');

const getFolioByBooking = async (req, res, next) => {
  try {
    const folio = await Folio.findOne({ booking: req.params.bookingId })
      .populate('guest', 'firstName lastName email phone')
      .populate('charges.addedBy', 'firstName lastName')
      .populate('payments.collectedBy', 'firstName lastName');
    if (!folio) throw new ApiError(404, 'Folio not found for this booking');

    res.status(200).json({ success: true, data: { ...folio.toObject(), breakdown: folio.getBreakdown() } });
  } catch (error) {
    next(error);
  }
};

const addChargeToFolio = async (req, res, next) => {
  try {
    const { type, description, amount } = req.body;
    const folio = await Folio.findOne({ booking: req.params.bookingId });
    if (!folio) throw new ApiError(404, 'Folio not found');

    folio.charges.push({ type, description, amount, addedBy: req.user._id });
    await folio.save();

    res.status(200).json({ success: true, message: 'Charge added', data: { ...folio.toObject(), breakdown: folio.getBreakdown() } });
  } catch (error) {
    next(error);
  }
};

const applyDiscount = async (req, res, next) => {
  try {
    const { description, amount } = req.body;
    const folio = await Folio.findOne({ booking: req.params.bookingId });
    if (!folio) throw new ApiError(404, 'Folio not found');

    folio.charges.push({ type: 'discount', description, amount: -Math.abs(amount), addedBy: req.user._id });
    await folio.save();

    res.status(200).json({ success: true, message: 'Discount applied', data: { ...folio.toObject(), breakdown: folio.getBreakdown() } });
  } catch (error) {
    next(error);
  }
};

const collectFolioPayment = async (req, res, next) => {
  try {
    const { amount, method, note } = req.body;
    const folio = await Folio.findOne({ booking: req.params.bookingId });
    if (!folio) throw new ApiError(404, 'Folio not found');

    folio.payments.push({ amount, method, note, collectedBy: req.user._id });
    await folio.save();

    const breakdown = folio.getBreakdown();
    const booking = await Booking.findById(req.params.bookingId);
    booking.paymentStatus = breakdown.balance <= 0 ? 'paid' : 'partial';
    await booking.save();

    // Send email payment receipt
    const guest = await User.findById(folio.guest);
    emailService.sendPaymentReceipt(guest, { amount, method });

    await notifyUser({
      recipientId: folio.guest,
      type: 'payment_successful',
      title: 'Payment Received',
      message: `We've received your payment of ₹${amount.toLocaleString()}.`,
      link: `/customer/invoices`,
    });

    res.status(200).json({ success: true, message: 'Payment collected', data: { ...folio.toObject(), breakdown } });
  } catch (error) {
    next(error);
  }
};

// Printable/downloadable receipt data (frontend renders as PDF via jsPDF)
const getReceiptData = async (req, res, next) => {
  try {
    const folio = await Folio.findOne({ booking: req.params.bookingId })
      .populate('guest', 'firstName lastName email phone address')
      .populate({ path: 'booking', populate: { path: 'room', select: 'roomNumber roomType' } });
    if (!folio) throw new ApiError(404, 'Folio not found');

    res.status(200).json({
      success: true,
      data: {
        guest: folio.guest,
        booking: folio.booking,
        charges: folio.charges,
        payments: folio.payments,
        breakdown: folio.getBreakdown(),
        issuedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFolioByBooking, addChargeToFolio, applyDiscount, collectFolioPayment, getReceiptData };