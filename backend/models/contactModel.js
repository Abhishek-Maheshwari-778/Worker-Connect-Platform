const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  sentBy:    { type: String, default: 'Admin' },
  message:   { type: String, required: true },
  sentAt:    { type: Date, default: Date.now },
  emailSent: { type: Boolean, default: false },
});

const contactSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, trim: true, lowercase: true },
  phone:      { type: String, trim: true },
  subject:    { type: String, required: true, trim: true },
  category:   {
    type: String,
    enum: ['general', 'support', 'billing', 'partnership', 'complaint', 'feedback', 'other'],
    default: 'general',
  },
  message:    { type: String, required: true, trim: true },
  status:     { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  priority:   { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  replies:    [replySchema],
  ipAddress:  { type: String },
  userAgent:  { type: String },
  isStarred:  { type: Boolean, default: false },
  adminNotes: { type: String },
}, { timestamps: true });

contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model('Contact', contactSchema);