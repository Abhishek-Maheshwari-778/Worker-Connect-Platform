/**
 * Audit Log Model
 * Records every significant admin action on the platform.
 */
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  adminId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName:  { type: String, required: true },

  // What was the action
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user_suspended', 'user_reactivated', 'user_deleted',
      // Verification actions
      'verification_approved', 'verification_rejected',
      // Job actions
      'job_deleted', 'job_removed_fraud', 'job_fraud_warned', 'job_fraud_cleared',
      // Badge/system actions
      'badges_recalculated', 'fraud_scan_run',
      // Rating actions
      'rating_deleted', 'rating_unflagged',
      // Custom admin action
      'custom',
    ],
  },

  // Category for filtering
  category: {
    type: String,
    enum: ['user', 'verification', 'job', 'system', 'fraud', 'rating'],
    required: true,
  },

  // Severity
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },

  // Human-readable description
  description: { type: String, required: true },

  // Target entity (what was acted upon)
  targetType:  { type: String, enum: ['User', 'Job', 'LabourProfile', 'ClientProfile', 'Rating', 'System'] },
  targetId:    { type: mongoose.Schema.Types.ObjectId },
  targetName:  { type: String }, // cached name for display even if record is deleted

  // Extra metadata (JSON)
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  // IP address
  ipAddress: { type: String },

  // Was this action reversed?
  isReversed:   { type: Boolean, default: false },
  reversedAt:   { type: Date },
  reversedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversalNote: { type: String },
}, {
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject:{ virtuals: true },
});

// Indexes for fast filtering
auditLogSchema.index({ adminId:  1, createdAt: -1 });
auditLogSchema.index({ action:   1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: -1 }); // default sort

module.exports = mongoose.model('AuditLog', auditLogSchema);