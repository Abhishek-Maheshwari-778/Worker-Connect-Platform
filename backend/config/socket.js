const { Server }  = require('socket.io');
const Notification = require('../models/notificationModel');

const onlineUsers = new Map(); // userId → Set of socketIds (multiple tabs)

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:   60000,
    pingInterval:  25000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌  Socket connected: ${socket.id}`);

    // ── Register user — join personal room ───────────────────────────────────
    socket.on('user:online', async (userId) => {
      if (!userId) return;

      socket.userId = userId;
      socket.join(`user:${userId}`);

      // Track multiple tabs
      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId).add(socket.id);

      io.emit('presence:update', Array.from(onlineUsers.keys()));

      // Send unread count on connect
      try {
        const count = await Notification.countDocuments({ userId, isRead: false, isHidden: false });
        socket.emit('notification:unreadCount', { count });
      } catch (_) {}
    });

    // ── Notification events ──────────────────────────────────────────────────
    socket.on('notification:read', async ({ notificationId, userId }) => {
      try {
        await Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true });
        const count = await Notification.countDocuments({ userId, isRead: false, isHidden: false });
        io.to(`user:${userId}`).emit('notification:unreadCount', { count });
      } catch (_) {}
    });

    socket.on('notification:bulkRead', async ({ userId }) => {
      try {
        await Notification.updateMany({ userId, isRead: false }, { isRead: true });
        io.to(`user:${userId}`).emit('notification:unreadCount', { count: 0 });
      } catch (_) {}
    });

    socket.on('notification:delete', async ({ notificationId, userId }) => {
      try {
        await Notification.findOneAndUpdate({ _id: notificationId, userId }, { isHidden: true });
      } catch (_) {}
    });

    // ── Chat room events ─────────────────────────────────────────────────────
    socket.on('room:join', (roomId) => socket.join(roomId));

    // Real-time message relay (room-based)
    socket.on('message:send', (payload) => {
      // Broadcast to all other sockets in the room (not back to sender)
      socket.to(payload.roomId).emit('message:receive', payload.message);
    });

    // Read receipt relay
    socket.on('messages:read', (payload) => {
      socket.to(payload.conversationId).emit('messages:read', payload);
    });

    // Message edit/delete relay
    socket.on('message:edited',  (payload) => socket.to(payload.conversationId).emit('message:edited',  payload));
    socket.on('message:deleted', (payload) => socket.to(payload.conversationId).emit('message:deleted', payload));

    socket.on('typing:start', ({ roomId, userId }) => {
      socket.to(roomId).emit('typing:update', { userId, isTyping: true });
    });

    socket.on('typing:stop', ({ roomId, userId }) => {
      socket.to(roomId).emit('typing:update', { userId, isTyping: false });
    });

    socket.on('job:status', (payload) => {
      io.to(payload.roomId).emit('job:statusUpdate', payload);
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const uid = socket.userId;
      if (uid && onlineUsers.has(uid)) {
        onlineUsers.get(uid).delete(socket.id);
        if (onlineUsers.get(uid).size === 0) onlineUsers.delete(uid);
      }
      io.emit('presence:update', Array.from(onlineUsers.keys()));
      console.log(`🔌  Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initSocket, onlineUsers };