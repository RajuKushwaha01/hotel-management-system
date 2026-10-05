const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');

const getMyNotifications = async (req, res, next) => {
  try {
    const { state, limit = 30 } = req.query;
    const filter = { recipient: req.user._id };
    if (state) filter.state = state;
    else filter.state = { $ne: 'archived' }; // default: hide archived

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, state: 'unread' });

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { state: 'read' },
      { new: true }
    );
    if (!notification) throw new ApiError(404, 'Notification not found');

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, state: 'unread' }, { state: 'read' });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const archiveNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { state: 'archived' },
      { new: true }
    );
    if (!notification) throw new ApiError(404, 'Notification not found');

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, archiveNotification };