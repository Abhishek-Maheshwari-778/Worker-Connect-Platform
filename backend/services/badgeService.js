/**
 * Badge & Reputation Service — Chunk 1 (Production Grade)
 * 
 * Responsibilities:
 *  - Evaluate all badge conditions dynamically
 *  - Assign / remove badges
 *  - Recalculate score, trust score, XP points, level
 *  - Record achievement timeline entries
 *  - Emit real-time socket events on badge earn / leaderboard change
 *  - Anti-fraud: exclude flagged ratings from averages
 */

const LabourProfile = require('../models/labourProfileModel');
const Rating        = require('../models/ratingModel');

// ── Badge rules (pure functions — easy to extend) ────────────────────────────
const BADGE_RULES = {
  verified: {
    label:       'Verified',
    description: 'Aadhaar identity verified by admin',
    icon:        'shield',
    sticky:      true, // once earned, never auto-removed
    check:       (p) => p.verificationStatus === 'approved',
  },
  top_rated: {
    label:       'Top Rated',
    description: 'Average rating ≥ 4.5 with at least 10 reviews',
    icon:        'star',
    sticky:      false,
    check:       (p) => p.averageRating >= 4.5 && p.validRatings >= 10,
  },
  fast_responder: {
    label:       'Fast Responder',
    description: 'Average response time under 5 minutes',
    icon:        'zap',
    sticky:      false,
    check:       (p) => p.responseTimeAvg < 5 && p.responseTimeAvg > 0,
  },
  reliable_worker: {
    label:       'Reliable Worker',
    description: 'Job completion rate ≥ 90% with 5+ jobs',
    icon:        'check-circle',
    sticky:      false,
    check:       (p) => p.completionRate >= 90 && p.completedJobs >= 5,
  },
  highly_experienced: {
    label:       'Highly Experienced',
    description: 'Completed 50 or more jobs on Labour Connect',
    icon:        'award',
    sticky:      false,
    check:       (p) => p.completedJobs >= 50,
  },
  rising_star: {
    label:       'Rising Star',
    description: 'Rating ≥ 4.7 in first 10 reviews',
    icon:        'trending-up',
    sticky:      false,
    // Rising star: ≥3 ratings, ≤10 ratings, avg ≥4.7
    check:       (p) => p.validRatings >= 3 && p.validRatings <= 10 && p.averageRating >= 4.7,
  },
  premium_labour: {
    label:       'Premium Labour',
    description: 'Elite: Rating ≥ 4.8 + 30 jobs + 95% completion + Aadhaar verified',
    icon:        'crown',
    sticky:      false,
    check:       (p) =>
      p.averageRating >= 4.8 &&
      p.completedJobs >= 30 &&
      p.completionRate >= 95 &&
      p.verificationStatus === 'approved',
  },
};

// ── Level thresholds (XP required per level) ─────────────────────────────────
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000, Infinity];

const LEVEL_NAMES = [
  '', 'Beginner', 'Apprentice', 'Skilled', 'Proficient',
  'Expert', 'Master', 'Elite', 'Legend', 'Champion', 'Grand Master',
];

// ── Milestone XP rewards ──────────────────────────────────────────────────────
const MILESTONE_XP = {
  first_job:   100,
  job_5:       150,
  job_10:      200,
  job_25:      300,
  job_50:      500,
  first_rating: 50,
  verified:    200,
  badge_earned: 75,
};

// ── Scoring functions ─────────────────────────────────────────────────────────

/** Leaderboard score (weighted) */
const calcScore = (p) => {
  const rtScore = p.responseTimeAvg > 0
    ? Math.max(0, 10 - Math.min(p.responseTimeAvg / 10, 10))
    : 0;
  return Math.round(
    (p.averageRating * 40) +
    (p.completedJobs  * 2) +
    (p.completionRate * 20) +
    (rtScore          * 10)
  );
};

/** Trust score 0–100 (holistic credibility) */
const calcTrust = (p) => {
  const ratingFactor     = (p.averageRating / 5) * 40;
  const completionFactor = (p.completionRate / 100) * 35;
  const verifiedFactor   = p.verificationStatus === 'approved' ? 15 : 0;
  const activityFactor   = Math.min(p.completedJobs / 20, 1) * 10;
  // Penalise flagged ratings slightly
  const fraudPenalty     = p.flaggedRatings > 0
    ? Math.min(p.flaggedRatings * 5, 15)
    : 0;
  return Math.min(100, Math.max(0, Math.round(
    ratingFactor + completionFactor + verifiedFactor + activityFactor - fraudPenalty
  )));
};

/** XP points earned based on activity */
const calcPoints = (p) => {
  let pts = 0;
  pts += p.completedJobs * 50;
  pts += p.averageRating * 100;
  pts += p.validRatings  * 10;
  pts += p.verificationStatus === 'approved' ? 200 : 0;
  pts += (p.badges || []).length * 75;
  // Bonus for high completion rate
  if (p.completionRate >= 95) pts += 100;
  else if (p.completionRate >= 90) pts += 50;
  return Math.round(pts);
};

/** Level 1–10 from XP points */
const calcLevel = (points) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

// ── Anti-fraud: recompute average from NON-flagged ratings only ───────────────
const recalculateCleanAverage = async (userId) => {
  const ratings = await Rating.find({ ratedUser: userId, type: 'client_to_labour', isFlagged: { $ne: true } });
  if (!ratings.length) return { avg: 0, total: 0 };
  const avg = ratings.reduce((s, r) => s + r.overallRating, 0) / ratings.length;
  return { avg: Math.round(avg * 10) / 10, total: ratings.length };
};

// ── Anti-fraud: flag suspicious rating patterns ───────────────────────────────
const detectFraud = async (newRating) => {
  const { ratedBy, ratedUser, job, overallRating } = newRating;

  // Rule 1: rater has rated this user too many times (>3 total across all jobs)
  const raterCount = await Rating.countDocuments({ ratedBy, ratedUser });
  if (raterCount > 3) {
    return { flagged: true, reason: 'duplicate_rater' };
  }

  // Rule 2: extreme outlier — 1★ when their average is ≥4.5 (possible sabotage)
  const profile = await LabourProfile.findOne({ user: ratedUser });
  if (profile && profile.validRatings >= 10 && overallRating === 1 && profile.averageRating >= 4.5) {
    return { flagged: true, reason: 'suspicious_pattern' };
  }

  // Rule 3: self-rating
  if (ratedBy.toString() === ratedUser.toString()) {
    return { flagged: true, reason: 'self_rating' };
  }

  return { flagged: false };
};

// ── Achievement timeline helper ───────────────────────────────────────────────
const addAchievement = (profile, type, label, description) => {
  // Avoid duplicate entries
  const alreadyHas = profile.achievementTimeline?.some(a => a.type === type);
  if (alreadyHas) return;
  if (!profile.achievementTimeline) profile.achievementTimeline = [];
  profile.achievementTimeline.push({
    type,
    label,
    description,
    earnedAt: new Date(),
    icon: BADGE_RULES[type]?.icon || 'award',
  });
};

// ── Main recalculate function ─────────────────────────────────────────────────
/**
 * Recalculate all reputation metrics for a labour profile.
 * Called after: job completion, rating submission, admin verification.
 *
 * @param {ObjectId|string} profileId  - LabourProfile._id
 * @param {SocketIO}        io         - Socket.IO instance (optional)
 * @returns {{ earned, removed, score, trustScore, level, points }}
 */
const recalculate = async (profileId, io = null) => {
  const profile = await LabourProfile.findById(profileId);
  if (!profile) return null;

  // ── 1. Recompute clean average (anti-fraud) ───────────────────────────────
  const { avg: cleanAvg, total: cleanTotal } = await recalculateCleanAverage(profile.user);
  const flaggedCount = await Rating.countDocuments({
    ratedUser: profile.user,
    type: 'client_to_labour',
    isFlagged: true,
  });

  profile.averageRating  = cleanAvg;
  profile.validRatings   = cleanTotal;
  profile.flaggedRatings = flaggedCount;
  if (cleanTotal > 0) profile.totalRatings = cleanTotal + flaggedCount;

  // ── 2. Recalculate completion rate ────────────────────────────────────────
  const denominator = profile.totalAcceptedJobs || profile.completedJobs || 1;
  profile.completionRate = Math.min(100, Math.round(
    (profile.completedJobs / denominator) * 100
  ));

  // ── 3. Evaluate badges ────────────────────────────────────────────────────
  const existingTypes = new Set(profile.badges.map(b => b.type));
  const newBadgeTypes = new Set();

  for (const [type, rule] of Object.entries(BADGE_RULES)) {
    if (rule.check(profile)) newBadgeTypes.add(type);
  }

  // Earned badges (newly qualifying)
  const earned = [];
  for (const type of newBadgeTypes) {
    if (!existingTypes.has(type)) {
      earned.push({ type, awardedAt: new Date() });
      // Add to achievement timeline
      addAchievement(
        profile,
        type,
        `Earned ${BADGE_RULES[type].label}`,
        BADGE_RULES[type].description
      );
    }
  }

  // Removed badges (no longer qualify — sticky badges never removed)
  const removed = [];
  for (const type of existingTypes) {
    const rule = BADGE_RULES[type];
    if (!newBadgeTypes.has(type) && rule && !rule.sticky) {
      removed.push(type);
    }
  }

  // Final badge array
  const keptBadges  = profile.badges.filter(b => !removed.includes(b.type));
  profile.badges    = [...keptBadges, ...earned];

  // ── 4. Job milestones ─────────────────────────────────────────────────────
  const milestones = [
    { count: 1,  key: 'first_job', label: 'First Job Completed',         desc: 'Completed your very first job!' },
    { count: 5,  key: 'job_5',     label: '5 Jobs Completed',            desc: 'Completed 5 jobs on Labour Connect.' },
    { count: 10, key: 'job_10',    label: '10 Jobs Completed',           desc: 'Completed 10 jobs — keep going!' },
    { count: 25, key: 'job_25',    label: '25 Jobs Completed',           desc: 'Quarter century of jobs done!' },
    { count: 50, key: 'job_50',    label: '50 Jobs Completed',           desc: '50 jobs milestone — you\'re a veteran!' },
  ];
  for (const m of milestones) {
    if (profile.completedJobs >= m.count) {
      addAchievement(profile, m.key, m.label, m.desc);
    }
  }

  // ── 5. Recalculate gamification scores ───────────────────────────────────
  const prevLevel   = profile.level;
  const score       = calcScore(profile);
  const trustScore  = calcTrust(profile);
  const points      = calcPoints(profile);
  const level       = calcLevel(points);

  profile.score      = score;
  profile.trustScore = trustScore;
  profile.points     = points;
  profile.level      = level;
  profile.lastActiveAt = new Date();

  // Level-up achievement
  if (level > prevLevel) {
    addAchievement(
      profile,
      `level_${level}`,
      `Reached Level ${level} — ${LEVEL_NAMES[level]}`,
      `You levelled up to ${LEVEL_NAMES[level]}!`
    );
  }

  await profile.save();

  // ── 6. Real-time socket events ────────────────────────────────────────────
  if (io) {
    // Badge earned → notify the user
    if (earned.length > 0) {
      io.to(`user:${profile.user}`).emit('badge:earned', {
        badges:     earned,
        score,
        trustScore,
        level,
        points,
        levelName: LEVEL_NAMES[level],
      });
    }
    // Level up → special event
    if (level > prevLevel) {
      io.to(`user:${profile.user}`).emit('level:up', {
        level,
        levelName: LEVEL_NAMES[level],
        points,
      });
    }
    // Always update leaderboard if score changed
    io.emit('leaderboard:update');
  }

  return { earned, removed, score, trustScore, points, level, levelName: LEVEL_NAMES[level] };
};

// ── Badge progress (how close to each unearned badge) ────────────────────────
const getBadgeProgress = (profile) => {
  const hasBadge = (type) => profile.badges?.some(b => b.type === type);
  const progress = [];

  if (!hasBadge('top_rated')) {
    const ratingPct = Math.min(100, Math.round((profile.averageRating / 4.5) * 100));
    const jobsPct   = Math.min(100, Math.round(((profile.validRatings || 0) / 10) * 100));
    progress.push({
      badge: 'top_rated', label: 'Top Rated', overallPct: Math.round((ratingPct + jobsPct) / 2),
      items: [
        { label: 'Average rating ≥ 4.5', current: profile.averageRating?.toFixed(1) || '0', target: '4.5', pct: ratingPct, done: profile.averageRating >= 4.5 },
        { label: 'Minimum 10 reviews',   current: profile.validRatings || 0, target: 10, pct: jobsPct, done: (profile.validRatings || 0) >= 10 },
      ],
    });
  }

  if (!hasBadge('reliable_worker')) {
    const compPct = Math.min(100, Math.round((profile.completionRate / 90) * 100));
    const jobsPct = Math.min(100, Math.round((profile.completedJobs / 5) * 100));
    progress.push({
      badge: 'reliable_worker', label: 'Reliable Worker', overallPct: Math.round((compPct + jobsPct) / 2),
      items: [
        { label: 'Completion rate ≥ 90%', current: `${profile.completionRate || 0}%`, target: '90%', pct: compPct, done: profile.completionRate >= 90 },
        { label: 'Minimum 5 jobs',        current: profile.completedJobs || 0, target: 5, pct: jobsPct, done: profile.completedJobs >= 5 },
      ],
    });
  }

  if (!hasBadge('highly_experienced')) {
    const pct = Math.min(100, Math.round((profile.completedJobs / 50) * 100));
    progress.push({
      badge: 'highly_experienced', label: 'Highly Experienced', overallPct: pct,
      items: [
        { label: 'Complete 50 jobs', current: profile.completedJobs || 0, target: 50, pct, done: profile.completedJobs >= 50 },
      ],
    });
  }

  if (!hasBadge('premium_labour')) {
    const r = Math.min(100, Math.round((profile.averageRating / 4.8) * 100));
    const j = Math.min(100, Math.round((profile.completedJobs / 30) * 100));
    const c = Math.min(100, Math.round((profile.completionRate / 95) * 100));
    const v = profile.verificationStatus === 'approved' ? 100 : 0;
    progress.push({
      badge: 'premium_labour', label: 'Premium Labour', overallPct: Math.round((r+j+c+v)/4),
      items: [
        { label: 'Rating ≥ 4.8',        current: profile.averageRating?.toFixed(1) || '0', target: '4.8', pct: r, done: profile.averageRating >= 4.8 },
        { label: '30+ jobs completed',  current: profile.completedJobs || 0, target: 30, pct: j, done: profile.completedJobs >= 30 },
        { label: 'Completion ≥ 95%',    current: `${profile.completionRate||0}%`, target: '95%', pct: c, done: profile.completionRate >= 95 },
        { label: 'Aadhaar verified',    current: profile.verificationStatus === 'approved' ? 'Yes' : 'No', target: 'Yes', pct: v, done: v === 100 },
      ],
    });
  }

  if (!hasBadge('fast_responder')) {
    const pct = profile.responseTimeAvg > 0
      ? Math.max(0, Math.round(((10 - Math.min(profile.responseTimeAvg, 10)) / 5) * 100))
      : 0;
    progress.push({
      badge: 'fast_responder', label: 'Fast Responder', overallPct: pct,
      items: [
        { label: 'Avg response < 5 min', current: profile.responseTimeAvg < 999 ? `${profile.responseTimeAvg}m` : 'N/A', target: '< 5 min', pct, done: profile.responseTimeAvg < 5 && profile.responseTimeAvg > 0 },
      ],
    });
  }

  return progress.sort((a, b) => b.overallPct - a.overallPct); // most-progressed first
};

module.exports = {
  recalculate,
  getBadgeProgress,
  detectFraud,
  recalculateCleanAverage,
  calcScore,
  calcTrust,
  calcPoints,
  calcLevel,
  LEVEL_THRESHOLDS,
  LEVEL_NAMES,
  BADGE_RULES,
};