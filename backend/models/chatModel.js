const mongoose = require('mongoose');

// ─── Conversation Schema ───────────────────────────────────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: true,
      },
    ],
    type: {
      type:    String,
      enum:    ['direct', 'support', 'group'],
      default: 'direct',
    },
    jobRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Job',
    },
    lastMessage: {
      content: String,
      sentAt:  Date,
      sentBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    isAdminSupport: { type: Boolean, default: false },
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    unreadCounts: [
      {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ jobRef: 1 });

// ─── Message Schema ────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Conversation',
      required: true,
    },
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    content: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 2000,
    },
    type: {
      type:    String,
      enum:    ['text', 'image', 'document', 'system'],
      default: 'text',
    },
    attachment: {
      url:       String,
      publicId:  String,
      fileName:  String,
      fileSize:  Number,
    },
    readBy: [
      {
        user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted:  { type: Boolean, default: false },
    isEdited:   { type: Boolean, default: false },
    replyTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message      = mongoose.model('Message', messageSchema);

module.exports = { Conversation, Message };