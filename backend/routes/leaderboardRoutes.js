const express      = require('express');
const router       = express.Router();
const asyncHandler = require('express-async-handler');
const LabourProfile = require('../models/labourProfileModel');
const User          = require('../models/userModel');
const { protect }   = require('../middleware/authMiddleware');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');
const { recalculate, getBadgeProgress, LEVEL_THRESHOLDS } = require('../services/badgeService');

// GET /api/leaderboard  — top labourers ranked by score
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { period = 'all', skill, category } = req.query;

  const filter = { score: { $gt: 0 } };

  // Period filter
  if (period === 'week') {
    filter.weeklyJobsCompleted = { $gt: 0 };
  } else if (period === 'month') {
    filter.monthlyJobsCompleted = { $gt: 0 };
  }

  // Skill filter
  if (skill) filter['skills.name'] = { $regex: skill, $options: 'i' };
  if (category) filter.preferredCategories = category;

  const [profiles, total] = await Promise.all([
    LabourProfile.find(filter)
      .populate('user', 'name avatar location isVerified')
      .sort({ score: -1, averageRating: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LabourProfile.countDocuments(filter),
  ]);

  // Add rank to each profile
  const data = profiles.map((p, i) => ({
    ...p,
    rank: skip + i + 1,
  }));

  paginatedResponse(res, data, total, page, limit, 'Leaderboard fetched');
}));

// GET /api/leaderboard/weekly-winner  — top labour this week
router.get('/weekly-winner', asyncHandler(async (req, res) => {
  const winner = await LabourProfile.findOne({ weeklyJobsCompleted: { $gt: 0 } })
    .populate('user', 'name avatar location')
    .sort({ weeklyJobsCompleted: -1, averageRating: -1 })
    .lean();
  successResponse(res, 200, 'Weekly winner', winner);
}));

// GET /api/leaderboard/:userId/badges  — get badges + progress for a user
router.get('/:userId/badges', asyncHandler(async (req, res) => {
  const profile = await LabourProfile.findOne({ user: req.params.userId }).lean();
  if (!profile) { res.status(404); throw new Error('Profile not found'); }
  const progress = getBadgeProgress(profile);
  const nextLevelPoints = LEVEL_THRESHOLDS[Math.min(profile.level, 9)];
  const prevLevelPoints = LEVEL_THRESHOLDS[Math.max((profile.level || 1) - 1, 0)];
  const levelProgress = nextLevelPoints > 0
    ? Math.round(((profile.points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100)
    : 100;
  successResponse(res, 200, 'Badges fetched', {
    badges:             profile.badges             || [],
    score:              profile.score              || 0,
    trustScore:         profile.trustScore         || 0,
    points:             profile.points             || 0,
    level:              profile.level              || 1,
    levelProgress:      Math.max(0, Math.min(100, levelProgress)),
    nextLevelPoints,
    badgeProgress:      progress,
    achievementTimeline: (profile.achievementTimeline || [])
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .slice(0, 20),
    completedJobs:      profile.completedJobs      || 0,
    completionRate:     profile.completionRate      || 0,
    averageRating:      profile.averageRating       || 0,
    totalRatings:       profile.validRatings        || profile.totalRatings || 0,
  });
}));

// POST /api/leaderboard/recalculate/:profileId  — internal trigger
router.post('/recalculate/:profileId', protect, asyncHandler(async (req, res) => {
  const result = await recalculate(req.params.profileId, req.app.locals.io);
  successResponse(res, 200, 'Recalculated', result);
}));

module.exports = router;