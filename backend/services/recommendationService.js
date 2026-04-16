const Job           = require('../models/jobModel');
const LabourProfile = require('../models/labourProfileModel');
const User          = require('../models/userModel');

/**
 * Score a job for a labour profile.
 * Returns a numeric score (higher = better match).
 */
const scoreJob = (job, profile, labourUser) => {
  let score = 0;

  // ── Skill match ───────────────────────────────────────────────────────────
  if (profile.skills && job.requirements) {
    const labourSkills = profile.skills.map((s) => s.name.toLowerCase());
    const jobSkills    = job.requirements.map((r) => r.skill.toLowerCase());
    const overlap      = labourSkills.filter((s) => jobSkills.includes(s));
    score += overlap.length * 30; // 30 pts per matching skill
  }

  // ── Location proximity ────────────────────────────────────────────────────
  if (
    labourUser?.location?.coordinates &&
    job?.location?.coordinates &&
    labourUser.location.coordinates[0] !== 0
  ) {
    const [lng1, lat1] = labourUser.location.coordinates;
    const [lng2, lat2] = job.location.coordinates;

    const toRad = (d) => (d * Math.PI) / 180;
    const R     = 6371; // km
    const dLat  = toRad(lat2 - lat1);
    const dLng  = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const radius = profile.workingRadius || 20;
    if (distKm <= radius)        score += 40;
    else if (distKm <= radius * 2) score += 20;
    else if (distKm <= radius * 3) score += 5;
  } else {
    // No geo data – give neutral bonus
    score += 15;
  }

  // ── Budget compatibility ───────────────────────────────────────────────────
  if (
    profile.dailyWageMin <= job.budgetMax &&
    profile.dailyWageMax >= job.budgetMin
  ) {
    score += 20;
  }

  // ── Preferred categories ──────────────────────────────────────────────────
  if (profile.preferredCategories?.includes(job.category)) {
    score += 15;
  }

  // ── Experience ────────────────────────────────────────────────────────────
  const minExp = job.requirements?.reduce((m, r) => Math.min(m, r.minExp || 0), Infinity) || 0;
  if (profile.experience >= minExp) score += 10;

  // ── Urgency bonus (urgent = more likely to need immediate hire) ────────────
  if (job.isUrgent) score += 5;

  return score;
};

/**
 * Get recommended jobs for a labour user.
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getRecommendedJobsForLabour = async (userId, limit = 10) => {
  const [labourUser, profile] = await Promise.all([
    User.findById(userId).lean(),
    LabourProfile.findOne({ user: userId }).lean(),
  ]);

  if (!profile) return [];

  const labourSkills = profile.skills?.map((s) => s.name.toLowerCase()) || [];

  // Fetch a candidate pool of open jobs (we score & rank in-memory)
  const CANDIDATE_POOL = Math.min(200, limit * 20);
  const candidateJobs = await Job.find({
    status: 'open',
    // Pre-filter: at least one skill matches OR no skill filter
    ...(labourSkills.length > 0 && {
      'requirements.skill': {
        $in: labourSkills.map((s) => new RegExp(s, 'i')),
      },
    }),
    // Exclude jobs the labour already applied to
    'applicants.labour': { $ne: userId },
  })
    .populate('postedBy', 'name avatar')
    .limit(CANDIDATE_POOL)
    .lean();

  // Score and sort
  const scored = candidateJobs
    .map((job) => ({ job, score: scoreJob(job, profile, labourUser) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ job, score }) => ({ ...job, _recommendationScore: score }));
};

/**
 * Get recommended labourers for a client's job.
 * @param {string} jobId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getRecommendedLabourersForJob = async (jobId, limit = 10) => {
  const job = await Job.findById(jobId).lean();
  if (!job) return [];

  const jobSkills = job.requirements?.map((r) => r.skill.toLowerCase()) || [];

  const candidateProfiles = await LabourProfile.find({
    isAvailable:        true,
    verificationStatus: 'approved',
    ...(jobSkills.length > 0 && {
      'skills.name': { $in: jobSkills.map((s) => new RegExp(s, 'i')) },
    }),
  })
    .populate('user', 'name avatar location')
    .limit(200)
    .lean();

  const scored = candidateProfiles
    .filter((p) => p.user)
    .map((profile) => ({
      profile,
      score: scoreJob(job, profile, profile.user),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ profile, score }) => ({
    ...profile,
    _recommendationScore: score,
  }));
};

module.exports = { getRecommendedJobsForLabour, getRecommendedLabourersForJob };