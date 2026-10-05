const Notification = require('../models/Notification');
const User = require('../models/User');

let ioRef = null;
const setIO = (io) => { ioRef = io; };

// Create a notification for one recipient and push it in real time if they're connected
const notifyUser = async ({ recipientId, type, title, message, link, relatedId }) => {
  try {
    const notification = await Notification.create({ recipient: recipientId, type, title, message, link, relatedId });
    if (ioRef) ioRef.to(`user:${recipientId}`).emit('notification', notification);
    return notification;
  } catch (err) {
    console.error('notifyUser failed:', err.message);
  }
};

// Create the same notification for every user with a given role (e.g. all managers)
const notifyRole = async ({ role, type, title, message, link, relatedId }) => {
  try {
    const users = await User.find({ role, isActive: true }).select('_id');
    const notifications = await Notification.insertMany(
      users.map((u) => ({ recipient: u._id, type, title, message, link, relatedId }))
    );
    if (ioRef) {
      notifications.forEach((n) => ioRef.to(`user:${n.recipient}`).emit('notification', n));
    }
    return notifications;
  } catch (err) {
    console.error('notifyRole failed:', err.message);
  }
};

module.exports = { setIO, notifyUser, notifyRole };