const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // ── Recipient ─────────────────────────────────────────────────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ── Sender ────────────────────────────────────────────────────────────────
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
    senderName:       { type: String, default: 'Labour Connect' },
    senderProfileUrl: { type: String, default: '' },
    senderRole:       { type: String, enum: ['labour', 'client', 'admin', 'system'], default: 'system' },

    // ── Content ───────────────────────────────────────────────────────────────
    type: {
      type:    String,
      enum:    ['job_applied', 'job_accepted', 'job_rejected', 'job_shortlisted',
                'job_completed', 'job_new', 'scheme_new', 'skill_demand',
                'user_registered', 'verification_approved', 'verification_rejected',
                'verification_pending', 'rating_received', 'message_received',
                'admin_alert', 'system'],
      required: true,
    },
    category: {
      type:    String,
      enum:    ['job', 'scheme', 'verification', 'message', 'rating', 'system', 'alert'],
      default: 'system',
    },
    priority:    { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    title:       { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 500 },

    // ── Reference ─────────────────────────────────────────────────────────────
    refModel: { type: String, enum: ['Job', 'User', 'Rating', 'Scheme', null], default: null },
    refId:    { type: mongoose.Schema.Types.ObjectId, default: null },

    // ── State ─────────────────────────────────────────────────────────────────
    isRead:   { type: Boolean, default: false, index: true },
    isHidden: { type: Boolean, default: false },

    // ── Action buttons ────────────────────────────────────────────────────────
    actionRequired: { type: Boolean, default: false },
    actions: [
      {
        label:  String,
        type:   { type: String, enum: ['accept', 'decline', 'reply', 'view', 'dismiss'] },
        done:   { type: Boolean, default: false },
        doneAt: Date,
      },
    ],
    replyMessage: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

// ── Compound indexes for fast querying ─────────────────────────────────────────
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isHidden: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }); // Auto-delete after 90 days

module.exports = mongoose.model('Notification', notificationSchema);