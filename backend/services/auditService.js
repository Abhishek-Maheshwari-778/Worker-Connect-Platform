/**
 * Audit Service
 * Lightweight helper to create audit log entries from any controller.
 * Non-blocking — never throws, logs errors silently.
 */
const AuditLog = require('../models/auditLogModel');

const SEVERITY_MAP = {
  user_suspended:          'critical',
  user_reactivated:        'warning',
  user_deleted:            'critical',
  verification_approved:   'info',
  verification_rejected:   'warning',
  job_deleted:             'warning',
  job_removed_fraud:       'critical',
  job_fraud_warned:        'warning',
  job_fraud_cleared:       'info',
  badges_recalculated:     'info',
  fraud_scan_run:          'info',
  rating_deleted:          'warning',
  rating_unflagged:        'info',
  custom:                  'info',
};

const CATEGORY_MAP = {
  user_suspended:          'user',
  user_reactivated:        'user',
  user_deleted:            'user',
  verification_approved:   'verification',
  verification_rejected:   'verification',
  job_deleted:             'job',
  job_removed_fraud:       'fraud',
  job_fraud_warned:        'fraud',
  job_fraud_cleared:       'fraud',
  badges_recalculated:     'system',
  fraud_scan_run:          'system',
  rating_deleted:          'rating',
  rating_unflagged:        'rating',
  custom:                  'system',
};

/**
 * Log an admin action.
 * @param {Object} opts
 * @param {ObjectId} opts.adminId
 * @param {string}   opts.adminName
 * @param {string}   opts.action        — enum from auditLogModel
 * @param {string}   opts.description   — human-readable
 * @param {string}   [opts.targetType]
 * @param {ObjectId} [opts.targetId]
 * @param {string}   [opts.targetName]
 * @param {Object}   [opts.metadata]
 * @param {string}   [opts.ipAddress]
 */
const log = async (opts) => {
  try {
    await AuditLog.create({
      adminId:    opts.adminId,
      adminName:  opts.adminName,
      action:     opts.action,
      category:   CATEGORY_MAP[opts.action] || 'system',
      severity:   SEVERITY_MAP[opts.action]  || 'info',
      description:opts.description,
      targetType: opts.targetType,
      targetId:   opts.targetId,
      targetName: opts.targetName,
      metadata:   opts.metadata   || {},
      ipAddress:  opts.ipAddress  || '',
    });
  } catch (err) {
    // Never crash the request — audit logging is best-effort
    console.warn('⚠️ Audit log failed:', err.message);
  }
};

module.exports = { log };