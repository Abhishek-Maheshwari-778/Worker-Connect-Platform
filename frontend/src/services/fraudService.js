/**
 * Job Fraud Detection Service
 * Analyses job patterns and flags suspicious activity automatically.
 *
 * Detection Rules:
 *  1. DUPLICATE_TITLE    — Same client posts same/very-similar title 3+ times
 *  2. HIGH_WAGE          — Budget > 5x platform average for same category
 *  3. GHOST_JOB          — Open 30+ days, 5+ applicants, zero hires
 *  4. NEVER_COMPLETED    — Client has 5+ jobs, completion rate < 20%
 *  5. RAPID_POSTING      — 5+ jobs posted in 24 hours by same client
 *  6. NO_HIRE_PATTERN    — Job accepted applications but never moved to in_progress
 *  7. BAIT_WAGE          — budgetMax is abnormally high vs budgetMin (>5x difference)
 */

const Job  = require('../models/jobModel');
const User = require('../models/userModel');

// ── Severity scoring ──────────────────────────────────────────────────────────
const RULE_SCORES = {
  duplicate_title:  { score: 25, severity: 'high'     },
  high_wage:        { score: 20, severity: 'medium'    },
  ghost_job:        { score: 30, severity: 'high'      },
  never_completed:  { score: 35, severity: 'critical'  },
  rapid_posting:    { score: 20, severity: 'medium'    },
  no_hire_pattern:  { score: 15, severity: 'low'       },
  bait_wage:        { score: 25, severity: 'high'      },
};

// ── Category average wages (INR/day) ─────────────────────────────────────────
const CATEGORY_AVG_WAGE = {
  construction: 600, electrical: 700, plumbing: 700,
  painting:     500, carpentry:  650, welding:  750,
  cleaning:     400, gardening:  350, moving:   500,
  security:     550, driving:    600, cooking:  450,
  other:        500,
};

// ── Stringsimilarity check (simple) ──────────────────────────────────────────
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const isSimilarTitle = (a, b) => {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  // Check if one contains the other (substring match ≥70%)
  const shorter = na.length < nb.length ? na : nb;
  const longer  = na.length < nb.length ? nb : na;
  return longer.includes(shorter) && shorter.length / longer.length > 0.7;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: Analyse a single job and return fraud flags
// ─────────────────────────────────────────────────────────────────────────────
const analyseJob = async (job) => {
  const flags = [];

  // ── Rule 1: Duplicate Title ──────────────────────────────────────────────
  const clientJobs = await Job.find({
    postedBy: job.postedBy,
    _id:      { $ne: job._id },
    createdAt:{ $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
  }).select('title').lean();

  const similarCount = clientJobs.filter(j => isSimilarTitle(j.title, job.title)).length;
  if (similarCount >= 2) {
    flags.push({
      type:        'duplicate_title',
      severity:    RULE_SCORES.duplicate_title.severity,
      description: `Same/similar job title posted ${similarCount + 1} times in 30 days by this client.`,
    });
  }

  // ── Rule 2: Unusually High Wage ──────────────────────────────────────────
  const avgWage = CATEGORY_AVG_WAGE[job.category] || 500;
  if (job.budgetMax > avgWage * 5) {
    flags.push({
      type:        'high_wage',
      severity:    job.budgetMax > avgWage * 10 ? 'critical' : RULE_SCORES.high_wage.severity,
      description: `Budget ₹${job.budgetMax}/day is ${Math.round(job.budgetMax / avgWage)}x the platform average (₹${avgWage}) for ${job.category}.`,
    });
  }

  // ── Rule 3: Ghost Job (open 30+ days with applicants, no hire) ───────────
  const ageMs    = Date.now() - new Date(job.createdAt).getTime();
  const ageDays  = ageMs / (1000 * 60 * 60 * 24);
  const applicantCount = job.applicants?.length || 0;
  const hiredCount     = job.hiredLabourers?.length || 0;

  if (job.status === 'open' && ageDays > 30 && applicantCount >= 5 && hiredCount === 0) {
    flags.push({
      type:        'ghost_job',
      severity:    RULE_SCORES.ghost_job.severity,
      description: `Job open for ${Math.round(ageDays)} days with ${applicantCount} applicants but no hires.`,
    });
  }

  // ── Rule 4: Never Completed Pattern (client-level) ───────────────────────
  const allClientJobs = await Job.find({ postedBy: job.postedBy }).select('status').lean();
  if (allClientJobs.length >= 5) {
    const completed = allClientJobs.filter(j => j.status === 'completed').length;
    const rate      = completed / allClientJobs.length;
    if (rate < 0.2) {
      flags.push({
        type:        'never_completed',
        severity:    RULE_SCORES.never_completed.severity,
        description: `Client has completed only ${Math.round(rate * 100)}% of ${allClientJobs.length} jobs (${completed} completed).`,
      });
    }
  }

  // ── Rule 5: Rapid Posting ────────────────────────────────────────────────
  const last24h = await Job.countDocuments({
    postedBy:  job.postedBy,
    _id:       { $ne: job._id },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (last24h >= 4) {
    flags.push({
      type:        'rapid_posting',
      severity:    last24h >= 10 ? 'critical' : RULE_SCORES.rapid_posting.severity,
      description: `Client posted ${last24h + 1} jobs in the last 24 hours.`,
    });
  }

  // ── Rule 6: Bait Wage (huge gap between min/max) ─────────────────────────
  if (job.budgetMin > 0 && job.budgetMax / job.budgetMin > 5) {
    flags.push({
      type:        'bait_wage',
      severity:    RULE_SCORES.bait_wage.severity,
      description: `Suspicious wage range: ₹${job.budgetMin}–₹${job.budgetMax}. Max is ${Math.round(job.budgetMax / job.budgetMin)}x the minimum.`,
    });
  }

  // ── Rule 7: No-hire after accepts ────────────────────────────────────────
  const acceptedCount = job.applicants?.filter(a => a.status === 'accepted').length || 0;
  if (acceptedCount > 0 && job.status === 'open' && ageDays > 14) {
    flags.push({
      type:        'no_hire_pattern',
      severity:    RULE_SCORES.no_hire_pattern.severity,
      description: `${acceptedCount} application(s) accepted but job still open after ${Math.round(ageDays)} days.`,
    });
  }

  // ── Calculate fraud score ─────────────────────────────────────────────────
  const fraudScore = Math.min(100, flags.reduce((sum, f) => sum + (RULE_SCORES[f.type]?.score || 10), 0));

  return { flags, fraudScore };
};

// ─────────────────────────────────────────────────────────────────────────────
// SCAN: Run analysis on all jobs and persist results
// ─────────────────────────────────────────────────────────────────────────────
const runFullScan = async (io = null) => {
  const jobs = await Job.find({ status: { $in: ['open', 'in_progress'] } })
    .select('title category postedBy budgetMin budgetMax status applicants hiredLabourers createdAt fraudFlags fraudScore')
    .lean();

  let newlyFlagged = 0;

  for (const job of jobs) {
    const { flags, fraudScore } = await analyseJob(job);
    if (flags.length > 0) {
      await Job.findByIdAndUpdate(job._id, {
        fraudFlags:     flags.map(f => ({ ...f, detectedAt: new Date(), autoDetected: true })),
        fraudScore,
        isFraudFlagged: true,
      });
      newlyFlagged++;
    } else {
      // Clear if previously flagged but now clean
      if (job.isFraudFlagged) {
        await Job.findByIdAndUpdate(job._id, {
          fraudFlags: [], fraudScore: 0, isFraudFlagged: false,
        });
      }
    }
  }

  if (io && newlyFlagged > 0) {
    io.to('admin-room').emit('fraud:scan-complete', { newlyFlagged, total: jobs.length });
  }

  console.log(`🔍 Fraud scan: ${newlyFlagged} suspicious jobs found out of ${jobs.length}`);
  return { newlyFlagged, total: jobs.length };
};

// ─────────────────────────────────────────────────────────────────────────────
// SCAN ON JOB CREATE — lightweight, runs after every new job
// ─────────────────────────────────────────────────────────────────────────────
const scanNewJob = async (jobId, io = null) => {
  try {
    const job = await Job.findById(jobId).lean();
    if (!job) return;
    const { flags, fraudScore } = await analyseJob(job);
    if (flags.length > 0) {
      await Job.findByIdAndUpdate(jobId, {
        fraudFlags:     flags.map(f => ({ ...f, detectedAt: new Date(), autoDetected: true })),
        fraudScore,
        isFraudFlagged: true,
      });
      if (io) {
        io.to('admin-room').emit('fraud:new-flag', {
          jobId,
          title: job.title,
          fraudScore,
          flags: flags.map(f => ({ type: f.type, severity: f.severity })),
        });
      }
    }
  } catch (e) {
    console.warn('Fraud scan error:', e.message);
  }
};

module.exports = { runFullScan, scanNewJob, analyseJob, RULE_SCORES, CATEGORY_AVG_WAGE };