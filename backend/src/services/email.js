const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const transporter = require('../config/email');

const compile = (templateName, data) => {
  const filePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const template = handlebars.compile(source);
  return template(data);
};

const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const html = compile(template, data);
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to, subject, html,
    });
    console.log(`📧 Email sent: ${template} → ${to}`);
  } catch (err) {
    console.error(`📧 Email failed (${template}):`, err.message);
  }
};

module.exports = {
  sendVerificationEmail: (user, verifyUrl) =>
    sendEmail({ to: user.email, subject: 'Verify Your Email — GrandVista Hotel', template: 'verifyEmail', data: { firstName: user.firstName, verifyUrl } }),

  sendPasswordResetEmail: (user, resetUrl) =>
    sendEmail({ to: user.email, subject: 'Reset Your Password — GrandVista Hotel', template: 'resetPassword', data: { firstName: user.firstName, resetUrl } }),

  sendBookingConfirmation: (user, booking, room) =>
    sendEmail({
      to: user.email, subject: 'Booking Confirmed — GrandVista Hotel', template: 'bookingConfirmation',
      data: { firstName: user.firstName, roomType: room.roomType, roomNumber: room.roomNumber, checkIn: new Date(booking.checkIn).toLocaleDateString(), checkOut: new Date(booking.checkOut).toLocaleDateString(), totalAmount: booking.totalAmount.toLocaleString(), bookingId: booking._id },
    }),

  sendCancellationEmail: (user, booking) =>
    sendEmail({ to: user.email, subject: 'Booking Cancelled — GrandVista Hotel', template: 'cancellation', data: { firstName: user.firstName, checkIn: new Date(booking.checkIn).toLocaleDateString(), bookingId: booking._id } }),

  sendPaymentReceipt: (user, payment) =>
    sendEmail({ to: user.email, subject: 'Payment Receipt — GrandVista Hotel', template: 'paymentReceipt', data: { firstName: user.firstName, amount: payment.amount.toLocaleString(), method: payment.method, date: new Date().toLocaleDateString() } }),

  sendInvoiceEmail: (user, breakdown) =>
    sendEmail({ to: user.email, subject: 'Your Invoice — GrandVista Hotel', template: 'invoice', data: { firstName: user.firstName, totalCharges: breakdown.totalCharges.toLocaleString(), totalPaid: breakdown.totalPaid.toLocaleString(), balance: breakdown.balance.toLocaleString() } }),

  sendCheckinConfirmation: (user, room) =>
    sendEmail({ to: user.email, subject: 'Welcome! Check-in Confirmed', template: 'checkinConfirmation', data: { firstName: user.firstName, roomNumber: room.roomNumber, checkOutTime: '11:00 AM' } }),

  sendCheckoutReceipt: (user, booking) =>
    sendEmail({ to: user.email, subject: 'Check-out Complete — Thank You!', template: 'checkoutReceipt', data: { firstName: user.firstName, totalAmount: booking.totalAmount.toLocaleString() } }),
};