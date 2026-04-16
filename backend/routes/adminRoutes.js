const express  = require('express');
const router   = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  toggleUserSuspension,
  deleteUser,
  getPendingVerifications,
  reviewVerification,
  getAllJobsAdmin,
  getBadgeStats,
  recalculateAll,
  getFlaggedRatings,
  unflagRating,
  deleteFlaggedRating,
  getFraudJobs,
  runFraudScan,
  reviewFraudJob,
  getFraudStats,
  getAuditLogs,
  getAuditSummary,
  getAnalytics,
  getInactiveUsers,
  sendReengagementEmail,
  deleteGhostAccounts,
  getVerificationSLA,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/dashboard',                  getDashboardStats);
router.get('/users',                      getAllUsers);
router.put('/users/:userId/suspend',      toggleUserSuspension);
router.delete('/users/:userId',           deleteUser);
router.get('/verifications',              getPendingVerifications);
router.put('/verifications/:profileId',   reviewVerification);
router.get('/jobs',                       getAllJobsAdmin);

// ── Badge analytics & recalculation ─────────────────────────────────────────
router.get('/badge-stats',              protect, authorize('admin'), getBadgeStats);
router.post('/recalculate-all-badges',  protect, authorize('admin'), recalculateAll);

// ── Fraud management ────────────────────────────────────────────────────────
router.get('/flagged-ratings',                 protect, authorize('admin'), getFlaggedRatings);
router.put('/flagged-ratings/:ratingId/unflag',protect, authorize('admin'), unflagRating);
router.delete('/flagged-ratings/:ratingId',    protect, authorize('admin'), deleteFlaggedRating);

// ── Job Fraud Detection ──────────────────────────────────────────────────────
router.get('/fraud-jobs',               getFraudJobs);
router.get('/fraud-stats',              getFraudStats);
router.post('/fraud-scan',              runFraudScan);
router.put('/fraud-jobs/:jobId/review', reviewFraudJob);

// ── Analytics ───────────────────────────────────────────────────────────────
router.get('/analytics', getAnalytics);

// ── Audit Log ────────────────────────────────────────────────────────────────
router.get('/audit-logs',     getAuditLogs);
router.get('/audit-summary',  getAuditSummary);

// ── Inactive Users ────────────────────────────────────────────────────────────
router.get('/inactive-users',           getInactiveUsers);
router.post('/inactive-users/email',    sendReengagementEmail);
router.post('/inactive-users/delete',   deleteGhostAccounts);

// ── Verification SLA ──────────────────────────────────────────────────────────
router.get('/verification-sla',         getVerificationSLA);

module.exports = router;