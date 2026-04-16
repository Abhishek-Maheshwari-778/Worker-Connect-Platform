const asyncHandler = require('express-async-handler');
const { Conversation, Message } = require('../models/chatModel');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

// ─── Get or create conversation ───────────────────────────────────────────────
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { participantId, jobId, type = 'direct' } = req.body;
  const userId = req.user._id;

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
    type,
    ...(jobId && { jobRef: jobId }),
  }).populate('participants', 'name avatar role').populate('jobRef', 'title');

  if (!conversation) {
    conversation = await Conversation.create({
      participants:  [userId, participantId],
      type,
      ...(jobId && { jobRef: jobId }),
      unreadCounts: [
        { user: userId,        count: 0 },
        { user: participantId, count: 0 },
      ],
    });
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar role')
      .populate('jobRef', 'title');
  }

  successResponse(res, 200, 'Conversation ready', conversation);
});

// ─── Get conversations list ────────────────────────────────────────────────────
const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    hiddenBy:     { $ne: req.user._id },   // exclude conversations hidden by this user
  })
    .populate('participants', 'name avatar role')
    .populate('jobRef', 'title')
    .sort({ updatedAt: -1 });

  successResponse(res, 200, 'Conversations fetched', conversations);
});

// ─── Get messages + mark read + emit read receipt ──────────────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);

  const conversation = await Conversation.findOne({
    _id:          req.params.conversationId,
    participants: req.user._id,
  });

  if (!conversation) { res.status(404); throw new Error('Conversation not found'); }

  const [messages, total] = await Promise.all([
    Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name avatar role')
      .populate('replyTo', 'content sender type')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ conversation: req.params.conversationId }),
  ]);

  // Mark received messages as read & reset unread counter
  await Message.updateMany(
    {
      conversation:   req.params.conversationId,
      sender:         { $ne: req.user._id },
      'readBy.user':  { $ne: req.user._id },
      isDeleted:      false,
    },
    { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
  );

  await Conversation.findByIdAndUpdate(req.params.conversationId, {
    $set: { 'unreadCounts.$[elem].count': 0 },
  }, { arrayFilters: [{ 'elem.user': req.user._id }] });

  // Emit read receipt via socket so sender sees double ticks
  const io = req.app.locals.io;
  if (io) {
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );
    if (otherParticipant) {
      io.to(`user:${otherParticipant}`).emit('messages:read', {
        conversationId: req.params.conversationId,
        readBy:         req.user._id,
      });
    }
    // Also update unread count in sidebar
    io.to(`user:${req.user._id}`).emit('notification:unreadCount', {
      count: 0,
    });
  }

  paginatedResponse(res, messages, total, page, limit, 'Messages fetched');
});

// ─── Send message (text or image) ─────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id:          req.params.conversationId,
    participants: req.user._id,
  });
  if (!conversation) { res.status(404); throw new Error('Conversation not found or access denied'); }

  let attachment = null;
  let msgType    = req.body.type || 'text';
  let content    = req.body.content || '';

  // Handle image upload
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder:   'labour-connect/chat',
      resource_type: 'auto',
    });
    attachment = { url: result.secure_url, publicId: result.public_id, fileName: req.file.originalname, fileSize: req.file.size };
    msgType    = 'image';
    content    = content || '📷 Photo';
  }

  const message = await Message.create({
    conversation: req.params.conversationId,
    sender:       req.user._id,
    content,
    type:         msgType,
    attachment,
    replyTo:      req.body.replyToId || null,
  });

  // Increment unread count for other participants
  await Conversation.findByIdAndUpdate(req.params.conversationId, {
    lastMessage: { content: msgType === 'image' ? '📷 Photo' : content, sentAt: message.createdAt, sentBy: req.user._id },
    $inc: { 'unreadCounts.$[notSender].count': 1 },
  }, { arrayFilters: [{ 'notSender.user': { $ne: req.user._id } }] });

  await message.populate('sender', 'name avatar role');
  await message.populate('replyTo', 'content sender type');

  // Emit via socket to conversation room
  const io = req.app.locals.io;
  if (io) {
    io.to(req.params.conversationId).emit('message:receive', message.toObject());
  }

  successResponse(res, 201, 'Message sent', message);
});

// ─── Edit message ──────────────────────────────────────────────────────────────
const editMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.messageId, sender: req.user._id });
  if (!message) { res.status(404); throw new Error('Message not found or not yours'); }
  if (message.isDeleted) { res.status(400); throw new Error('Cannot edit a deleted message'); }
  if (message.type === 'image') { res.status(400); throw new Error('Cannot edit image messages'); }

  message.content  = req.body.content;
  message.isEdited = true;
  await message.save();

  const io = req.app.locals.io;
  if (io) io.to(message.conversation.toString()).emit('message:edited', { messageId: message._id, content: message.content });

  successResponse(res, 200, 'Message edited', message);
});

// ─── Delete message (soft) ─────────────────────────────────────────────────────
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.messageId, sender: req.user._id });
  if (!message) { res.status(404); throw new Error('Message not found or not yours'); }

  // Delete Cloudinary image if present
  if (message.attachment?.publicId) {
    await deleteFromCloudinary(message.attachment.publicId).catch(() => {});
  }

  message.isDeleted  = true;
  message.content    = 'This message was deleted';
  message.attachment = null;
  await message.save();

  const io = req.app.locals.io;
  if (io) io.to(message.conversation.toString()).emit('message:deleted', { messageId: message._id });

  successResponse(res, 200, 'Message deleted');
});

// ─── Delete (hide) a conversation for the current user ────────────────────────
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id:          req.params.conversationId,
    participants: req.user._id,
  });
  if (!conversation) { res.status(404); throw new Error('Conversation not found'); }

  // Soft-delete: track which users have hidden this conversation
  if (!conversation.hiddenBy) conversation.hiddenBy = [];
  const alreadyHidden = conversation.hiddenBy.some(
    id => id.toString() === req.user._id.toString()
  );
  if (!alreadyHidden) {
    conversation.hiddenBy.push(req.user._id);
    await conversation.save();
  }

  successResponse(res, 200, 'Conversation deleted');
});

module.exports = {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteConversation,
};