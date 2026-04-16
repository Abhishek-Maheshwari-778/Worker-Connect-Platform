const mongoose = require('mongoose');

const savedSchemeSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scheme: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },
  savedAt:{ type: Date, default: Date.now },
}, { timestamps: false });

// One save per user per scheme
savedSchemeSchema.index({ user: 1, scheme: 1 }, { unique: true });

module.exports = mongoose.model('SavedScheme', savedSchemeSchema);