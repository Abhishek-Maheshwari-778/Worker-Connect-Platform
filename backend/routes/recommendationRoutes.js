const express      = require('express');
const router       = express.Router();
const asyncHandler = require('express-async-handler');
const { getRecommendedJobsForLabour, getRecommendedLabourersForJob } = require('../services/recommendationService');
const { protect, authorize } = require('../middleware/authMiddleware');
const { successResponse }    = require('../utils/apiResponse');

// ── Recommended jobs for the logged-in labour ─────────────────────────────────
router.get(
  '/jobs',
  protect,
  authorize('labour'),
  asyncHandler(async (req, res) => {
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const jobs  = await getRecommendedJobsForLabour(req.user._id, limit);
    successResponse(res, 200, 'Recommended jobs', jobs);
  })
);

// ── Recommended labourers for a job (client view) ─────────────────────────────
router.get(
  '/labourers/:jobId',
  protect,
  authorize('client'),
  asyncHandler(async (req, res) => {
    const limit     = Math.min(20, parseInt(req.query.limit) || 10);
    const labourers = await getRecommendedLabourersForJob(req.params.jobId, limit);
    successResponse(res, 200, 'Recommended labourers', labourers);
  })
);

module.exports = router;
