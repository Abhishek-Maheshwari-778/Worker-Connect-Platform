const asyncHandler   = require('express-async-handler');
const Notification   = require('../models/notificationModel');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

// ─── GET /api/notifications — paginated list ──────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { filter = 'all', category } = req.query;

  const query = { userId: req.user._id, isHidden: false };
  if (filter === 'unread') query.isRead = false;
  if (category && category !== 'all') query.category = category;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.user._id, isRead: false, isHidden: false }),
  ]);

  paginatedResponse(res, notifications, total, page, limit, 'Notifications fetched', { unreadCount });
});

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId:   req.user._id,
    isRead:   false,
    isHidden: false,
  });
  successResponse(res, 200, 'Unread count', { count });
});

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notif) { res.status(404); throw new Error('Notification not found'); }

  // Emit updated unread count via socket
  const io = req.app.locals.io;
  if (io) {
    const newCount = await Notification.countDocuments({ userId: req.user._id, isRead: false, isHidden: false });
    io.to(`user:${req.user._id}`).emit('notification:unreadCount', { count: newCount });
  }

  successResponse(res, 200, 'Marked as read', notif);
});

// ─── PUT /api/notifications/mark-all-read ────────────────────────────────────
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );
  const io = req.app.locals.io;
  if (io) io.to(`user:${req.user._id}`).emit('notification:unreadCount', { count: 0 });

  successResponse(res, 200, 'All notifications marked as read');
});

// ─── DELETE /api/notifications/:id — soft delete (hide) ──────────────────────
const hideNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isHidden: true }
  );
  successResponse(res, 200, 'Notification dismissed');
});

// ─── DELETE /api/notifications/clear-all ─────────────────────────────────────
const clearAll = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id }, { isHidden: true });
  successResponse(res, 200, 'All notifications cleared');
});

// ─── PUT /api/notifications/:id/action ───────────────────────────────────────
const handleAction = asyncHandler(async (req, res) => {
  const { actionType, replyMessage } = req.body;
  const notif = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
  if (!notif) { res.status(404); throw new Error('Notification not found'); }

  // Mark the action as done
  const action = notif.actions.find(a => a.type === actionType);
  if (action) { action.done = true; action.doneAt = new Date(); }
  if (replyMessage) notif.replyMessage = replyMessage;
  notif.isRead = true;
  await notif.save();

  successResponse(res, 200, 'Action handled', notif);
});

module.exports = {
  getNotifications, getUnreadCount,
  markAsRead, markAllRead,
  hideNotification, clearAll,
  handleAction,
};