const asyncHandler  = require('express-async-handler');
const auditService  = require('../services/auditService');
const User          = require('../models/userModel');
const LabourProfile  = require('../models/labourProfileModel');
const badgeService   = require('../services/badgeService');
const notifService   = require('../services/notificationService');
const ClientProfile = require('../models/clientProfileModel');
const Job           = require('../models/jobModel');
const Rating        = require('../models/ratingModel');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

// ─── @desc   Admin dashboard analytics
// ─── @route  GET /api/admin/dashboard
// ─── @access Private (admin)
const getDashboardStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalLabour,
    totalClients,
    totalJobs,
    openJobs,
    completedJobs,
    pendingVerifications,
    recentUsers,
    recentJobs,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ role: 'labour' }),
    User.countDocuments({ role: 'client' }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'open' }),
    Job.countDocuments({ status: 'completed' }),
    LabourProfile.countDocuments({ verificationStatus: 'pending' }),
    User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 }).limit(5)
      .select('name email role avatar createdAt'),
    Job.find()
      .sort({ createdAt: -1 }).limit(5)
      .populate('postedBy', 'name')
      .select('title status category createdAt'),
  ]);

  successResponse(res, 200, 'Dashboard stats fetched', {
    stats: {
      totalUsers, totalLabour, totalClients,
      totalJobs, openJobs, completedJobs,
      pendingVerifications,
    },
    recentUsers,
    recentJobs,
  });
});

// ─── @desc   Get all users with filters
// ─── @route  GET /api/admin/users
// ─── @access Private (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { role, isSuspended, search } = req.query;

  const filter = {};
  if (role)        filter.role        = role;
  if (isSuspended) filter.isSuspended = isSuspended === 'true';
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -emailVerificationToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  paginatedResponse(res, users, total, page, limit, 'Users fetched');
});

// ─── @desc   Suspend or activate a user
// ─── @route  PUT /api/admin/users/:userId/suspend
// ─── @access Private (admin)
const toggleUserSuspension = asyncHandler(async (req, res) => {
  const { reason = 'No reason provided' } = req.body;
  const user = await User.findById(req.params.userId);

  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(403); throw new Error('Cannot suspend an admin account'); }

  const wasSuspended = user.isSuspended;
  const nowSuspended = !wasSuspended;
  const io           = req.app.locals.io;

  // Toggle + record reason/timestamp
  user.isSuspended  = nowSuspended;
  user.suspendedAt  = nowSuspended ? new Date() : undefined;
  user.suspendedBy  = nowSuspended ? req.user._id : undefined;
  user.suspendReason= nowSuspended ? reason.trim() : '';

  // Append to audit history
  if (!user.suspensionHistory) user.suspensionHistory = [];
  user.suspensionHistory.push({
    action:   nowSuspended ? 'suspended' : 'unsuspended',
    reason:   reason.trim(),
    actionBy: req.user._id,
    actionAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });

  // ── 1. Instant socket kick — force logout immediately ────────────────────
  if (io) {
    if (nowSuspended) {
      // Emit to user's personal room — all their tabs/devices
      io.to(`user:${user._id}`).emit('account:suspended', {
        reason:  reason.trim(),
        message: 'Your account has been suspended by an administrator.',
      });
    } else {
      io.to(`user:${user._id}`).emit('account:reactivated', {
        message: 'Your account has been reactivated. You can now log in.',
      });
    }
  }

  // ── 2. Email notification ─────────────────────────────────────────────────
  try {
    const sendEmail = require('../utils/sendEmail');
    if (nowSuspended) {
      await sendEmail({
        to:      user.email,
        subject: '⚠️ Your Labour Connect Account Has Been Suspended',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #fecaca;border-radius:16px;background:#fff">
            <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
              <h1 style="color:#fff;margin:0;font-size:20px">⚠️ Account Suspended</h1>
            </div>
            <p style="color:#374151;font-size:15px">Dear <strong>${user.name}</strong>,</p>
            <p style="color:#374151;font-size:15px">Your Labour Connect account has been temporarily suspended.</p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:20px 0">
              <p style="margin:0;font-size:14px;color:#991b1b"><strong>Reason:</strong> ${reason.trim()}</p>
            </div>
            <p style="color:#374151;font-size:14px">If you believe this is a mistake, please contact our support team at <a href="mailto:support@labourconnect.in" style="color:#f97316">support@labourconnect.in</a></p>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:20px 0">
            <p style="color:#9ca3af;font-size:12px">Labour Connect · This is an automated message</p>
          </div>
        `,
      });
    } else {
      await sendEmail({
        to:      user.email,
        subject: '✅ Your Labour Connect Account Has Been Reactivated',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #bbf7d0;border-radius:16px;background:#fff">
            <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
              <h1 style="color:#fff;margin:0;font-size:20px">✅ Account Reactivated</h1>
            </div>
            <p style="color:#374151;font-size:15px">Dear <strong>${user.name}</strong>,</p>
            <p style="color:#374151;font-size:15px">Your Labour Connect account has been reactivated. You can now log in and use the platform normally.</p>
            <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:12px">Log In Now</a>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:20px 0">
            <p style="color:#9ca3af;font-size:12px">Labour Connect · This is an automated message</p>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.warn('⚠️ Suspension email failed:', emailErr.message);
  }

  const action = nowSuspended ? 'suspended' : 'reactivated';

  // Audit log
  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     nowSuspended ? 'user_suspended' : 'user_reactivated',
    description:`${nowSuspended ? 'Suspended' : 'Reactivated'} user "${user.name}" (${user.email}). Reason: ${reason.trim()}`,
    targetType: 'User',
    targetId:   user._id,
    targetName: user.name,
    metadata:   { reason: reason.trim(), userRole: user.role, userEmail: user.email },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `User ${action} successfully`, {
    isSuspended: user.isSuspended,
    suspendReason: user.suspendReason,
    suspendedAt: user.suspendedAt,
  });
});

// ─── @desc   Delete a user account
// ─── @route  DELETE /api/admin/users/:userId
// ─── @access Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete admin accounts');
  }

  // Cascade: remove associated profiles
  if (user.role === 'labour' && user.labourProfile) {
    await LabourProfile.findByIdAndDelete(user.labourProfile);
  }

  await user.deleteOne();
  successResponse(res, 200, 'User deleted successfully');
});

// ─── @desc   Get all pending verifications
// ─── @route  GET /api/admin/verifications
// ─── @access Private (admin)
const getPendingVerifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { type } = req.query; // 'labour' | 'client' | undefined (all)

  const labourQuery = LabourProfile.find({ verificationStatus: 'pending' })
    .populate('user', 'name email phone avatar role createdAt')
    .sort({ updatedAt: 1 });

  const clientQuery = ClientProfile.find({ verificationStatus: 'pending' })
    .populate('user', 'name email phone avatar role createdAt')
    .sort({ updatedAt: 1 });

  let profiles = [];
  let total    = 0;

  if (type === 'labour') {
    [profiles, total] = await Promise.all([
      labourQuery.skip(skip).limit(limit),
      LabourProfile.countDocuments({ verificationStatus: 'pending' }),
    ]);
    profiles = profiles.map(p => ({ ...p.toObject(), profileType: 'labour' }));
  } else if (type === 'client') {
    [profiles, total] = await Promise.all([
      clientQuery.skip(skip).limit(limit),
      ClientProfile.countDocuments({ verificationStatus: 'pending' }),
    ]);
    profiles = profiles.map(p => ({ ...p.toObject(), profileType: 'client' }));
  } else {
    // Return both merged
    const [labourProfiles, clientProfiles, lTotal, cTotal] = await Promise.all([
      labourQuery,
      clientQuery,
      LabourProfile.countDocuments({ verificationStatus: 'pending' }),
      ClientProfile.countDocuments({ verificationStatus: 'pending' }),
    ]);
    const lMapped = labourProfiles.map(p => ({ ...p.toObject(), profileType: 'labour' }));
    const cMapped = clientProfiles.map(p => ({ ...p.toObject(), profileType: 'client' }));
    profiles = [...lMapped, ...cMapped].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    total    = lTotal + cTotal;
    // Apply pagination manually
    profiles = profiles.slice(skip, skip + limit);
  }

  paginatedResponse(res, profiles, total, page, limit, 'Pending verifications');
});

// ─── @desc   Approve or reject a verification
// ─── @route  PUT /api/admin/verifications/:profileId
// ─── @access Private (admin)
const reviewVerification = asyncHandler(async (req, res) => {
  const { action, reviewNote, profileType = 'labour' } = req.body;

  if (!['approved', 'rejected'].includes(action)) {
    res.status(400); throw new Error('Action must be approved or rejected');
  }

  // Find the profile — check both models
  let profile = await LabourProfile.findById(req.params.profileId);
  let isClient = false;

  if (!profile) {
    profile = await ClientProfile.findById(req.params.profileId);
    isClient = true;
  }

  if (!profile) { res.status(404); throw new Error('Profile not found'); }

  profile.verificationStatus = action;

  // Safely update aadhaarDoc (may not exist on old documents)
  if (!profile.aadhaarDoc) profile.aadhaarDoc = {};
  profile.aadhaarDoc.status     = action;
  profile.aadhaarDoc.reviewNote = reviewNote || '';
  profile.aadhaarDoc.reviewedAt = new Date();
  profile.aadhaarDoc.reviewedBy = req.user._id;

  if (action === 'approved') {
    if (!isClient && profile.badges) {
      const alreadyHasBadge = profile.badges.some(b => b.type === 'verified');
      if (!alreadyHasBadge) profile.badges.push({ type: 'verified' });
    }
    await User.findByIdAndUpdate(profile.user, { isVerified: true });
    if (isClient) profile.isVerified = true;
  } else {
    if (isClient) profile.isVerified = false;
    await User.findByIdAndUpdate(profile.user, { isVerified: false });
  }

  await profile.save();

  // ── Persistent notification + real-time emit ──────────────────────────────
  const userName = isClient ? 'Client' : 'Worker';
  const approvedMsg = `✅ Your Aadhaar has been verified! Your profile now shows a Verified badge.`;
  const rejectedMsg = `❌ Aadhaar verification rejected. ${reviewNote ? 'Reason: ' + reviewNote : 'Please re-upload a clearer photo.'}`;

  await notifService.createAndEmit({
    userId:      profile.user,
    senderName:  'Labour Connect Admin',
    senderRole:  'admin',
    type:        action === 'approved' ? 'verification_approved' : 'verification_rejected',
    category:    'system',
    priority:    action === 'approved' ? 'high' : 'normal',
    title:       action === 'approved' ? '🛡️ Identity Verified!' : '⚠️ Verification Rejected',
    description: action === 'approved' ? approvedMsg : rejectedMsg,
    refModel:    null,
    refId:       null,
    actionRequired: action === 'rejected',
  });

  // Real-time socket event to update UI immediately
  const io = req.app.locals.io;
  if (io) {
    io.to(`user:${profile.user}`).emit('verification:updated', {
      status:             action,
      verificationStatus: action,
      isVerified:         action === 'approved',
    });
  }

  // Recalculate badges after verification
  try {
    await badgeService.recalculate(profile._id, req.app.locals.io);
  } catch (e) { console.error('Badge recalc error:', e.message); }

  // Audit log
  const targetUser = await User.findById(profile.user).select('name email');
  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     action === 'approved' ? 'verification_approved' : 'verification_rejected',
    description:`${action === 'approved' ? 'Approved' : 'Rejected'} Aadhaar verification for "${targetUser?.name}" (${isClient ? 'client' : 'labour'}). ${reviewNote ? 'Note: ' + reviewNote : ''}`,
    targetType: isClient ? 'ClientProfile' : 'LabourProfile',
    targetId:   profile._id,
    targetName: targetUser?.name,
    metadata:   { reviewNote, profileType: isClient ? 'client' : 'labour', userEmail: targetUser?.email },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `Verification ${action}`, {
    verificationStatus: profile.verificationStatus,
  });
});

// ─── @desc   Get platform-level job stats
// ─── @route  GET /api/admin/jobs
// ─── @access Private (admin)
const getAllJobsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { status, category } = req.query;

  const filter = {};
  if (status)   filter.status   = status;
  if (category) filter.category = category;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  paginatedResponse(res, jobs, total, page, limit, 'Jobs fetched');
});

// ─── Job Fraud Detection ──────────────────────────────────────────────────────

// GET /api/admin/fraud-jobs — list flagged jobs with stats
const getFraudJobs = asyncHandler(async (req, res) => {
  const Job = require('../models/jobModel');
  const { severity, type, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const filter = { isFraudFlagged: true };
  if (severity) filter['fraudFlags.severity'] = severity;
  if (type)     filter['fraudFlags.type']     = type;

  const [jobs, total, stats] = await Promise.all([
    Job.find(filter)
      .populate('postedBy', 'name email avatar phone isSuspended')
      .sort({ fraudScore: -1, createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .lean(),
    Job.countDocuments(filter),
    Job.aggregate([
      { $match: { isFraudFlagged: true } },
      { $group: {
          _id: null,
          totalFlagged: { $sum: 1 },
          avgScore:     { $avg: '$fraudScore' },
          critical:     { $sum: { $cond: [{ $gte: ['$fraudScore', 70] }, 1, 0] } },
          high:         { $sum: { $cond: [{ $and: [{ $gte: ['$fraudScore', 40] }, { $lt: ['$fraudScore', 70] }] }, 1, 0] } },
          medium:       { $sum: { $cond: [{ $and: [{ $gte: ['$fraudScore', 20] }, { $lt: ['$fraudScore', 40] }] }, 1, 0] } },
          low:          { $sum: { $cond: [{ $lt: ['$fraudScore', 20] }, 1, 0] } },
      }},
    ]),
  ]);

  res.json({ success: true, data: jobs, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) }, stats: stats[0] || {} });
});

// POST /api/admin/fraud-scan — trigger full scan
const runFraudScan = asyncHandler(async (req, res) => {
  const { runFullScan } = require('../services/fraudService');
  const result = await runFullScan(req.app.locals.io);
  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'fraud_scan_run',
    description:`Manual fraud scan completed. ${result.newlyFlagged} new suspicious jobs detected out of ${result.total} scanned.`,
    targetType: 'System',
    metadata:   { newlyFlagged: result.newlyFlagged, total: result.total },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `Scan complete: ${result.newlyFlagged} suspicious jobs found`, result);
});

// PUT /api/admin/fraud-jobs/:jobId/review — admin takes action
const reviewFraudJob = asyncHandler(async (req, res) => {
  const Job = require('../models/jobModel');
  const { action, note } = req.body; // action: 'cleared' | 'warned' | 'removed'

  const job = await Job.findById(req.params.jobId).populate('postedBy', 'name email');
  if (!job) { res.status(404); throw new Error('Job not found'); }

  job.fraudAction     = action;
  job.fraudNote       = note || '';
  job.fraudReviewedBy = req.user._id;
  job.fraudReviewedAt = new Date();

  if (action === 'cleared') {
    job.isFraudFlagged = false;
    job.fraudScore     = 0;
    job.fraudFlags     = [];
  }

  if (action === 'removed') {
    job.status = 'cancelled';
  }

  // Warn client via notification
  if (action === 'warned' || action === 'removed') {
    try {
      const notifService = require('../services/notificationService');
      await notifService.createAndEmit({
        userId:      job.postedBy._id,
        senderId:    req.user._id,
        senderName:  'Labour Connect Admin',
        senderRole:  'admin',
        type:        'system_alert',
        category:    'alert',
        priority:    'urgent',
        title:       action === 'removed' ? '⛔ Job Removed — Policy Violation' : '⚠️ Fraud Warning on Your Job',
        description: action === 'removed'
          ? `Your job "${job.title}" was removed for violating our platform policies. ${note || ''}`
          : `Your job "${job.title}" has been flagged for suspicious activity. ${note || ''} Please review our posting guidelines.`,
        refModel: 'Job',
        refId:    job._id,
      });
    } catch (_) {}
  }

  await job.save({ validateBeforeSave: false });

  // Audit log
  const fraudAction = action === 'removed' ? 'job_removed_fraud' : action === 'warned' ? 'job_fraud_warned' : 'job_fraud_cleared';
  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     fraudAction,
    description:`${action.charAt(0).toUpperCase() + action.slice(1)} job "${job.title}" for fraud (score: ${job.fraudScore}/100). ${note ? 'Note: ' + note : ''}`,
    targetType: 'Job',
    targetId:   job._id,
    targetName: job.title,
    metadata:   { action, note, fraudScore: job.fraudScore, flags: job.fraudFlags?.map(f => f.type), clientName: job.postedBy?.name },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `Job ${action}`, job);
});

// GET /api/admin/fraud-stats — summary stats for dashboard widget
const getFraudStats = asyncHandler(async (req, res) => {
  const Job = require('../models/jobModel');
  const [overview, byType, recentFlags, topOffenders] = await Promise.all([
    Job.aggregate([
      { $group: {
        _id: null,
        total:    { $sum: 1 },
        flagged:  { $sum: { $cond: ['$isFraudFlagged', 1, 0] } },
        removed:  { $sum: { $cond: [{ $eq: ['$fraudAction', 'removed'] }, 1, 0] } },
        cleared:  { $sum: { $cond: [{ $eq: ['$fraudAction', 'cleared'] }, 1, 0] } },
        avgScore: { $avg: '$fraudScore' },
      }},
    ]),
    Job.aggregate([
      { $match: { isFraudFlagged: true } },
      { $unwind: '$fraudFlags' },
      { $group: { _id: '$fraudFlags.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Job.find({ isFraudFlagged: true })
      .populate('postedBy', 'name avatar')
      .sort({ fraudScore: -1, updatedAt: -1 })
      .limit(5)
      .select('title fraudScore fraudFlags postedBy updatedAt')
      .lean(),
    Job.aggregate([
      { $match: { isFraudFlagged: true } },
      { $group: { _id: '$postedBy', count: { $sum: 1 }, avgScore: { $avg: '$fraudScore' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { count: 1, avgScore: 1, 'user.name': 1, 'user.email': 1, 'user.avatar': 1 } },
    ]),
  ]);

  successResponse(res, 200, 'Fraud stats', {
    overview:     overview[0] || {},
    byType,
    recentFlags,
    topOffenders,
  });
});

// ─── Badge & Reputation Analytics ───────────────────────────────────────────
const getBadgeStats = asyncHandler(async (req, res) => {
  const [
    totalProfiles,
    verifiedCount,
    topRatedCount,
    fastResponderCount,
    reliableWorkerCount,
    highlyExpCount,
    risingStarCount,
    premiumCount,
    levelDist,
    topScorers,
    flaggedRatingsCount,
    avgTrustScore,
  ] = await Promise.all([
    LabourProfile.countDocuments(),
    LabourProfile.countDocuments({ 'badges.type': 'verified' }),
    LabourProfile.countDocuments({ 'badges.type': 'top_rated' }),
    LabourProfile.countDocuments({ 'badges.type': 'fast_responder' }),
    LabourProfile.countDocuments({ 'badges.type': 'reliable_worker' }),
    LabourProfile.countDocuments({ 'badges.type': 'highly_experienced' }),
    LabourProfile.countDocuments({ 'badges.type': 'rising_star' }),
    LabourProfile.countDocuments({ 'badges.type': 'premium_labour' }),
    LabourProfile.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    LabourProfile.find({ score: { $gt: 0 } })
      .populate('user', 'name avatar')
      .sort({ score: -1 })
      .limit(5)
      .lean(),
    Rating.countDocuments({ isFlagged: true }),
    LabourProfile.aggregate([
      { $group: { _id: null, avg: { $avg: '$trustScore' } } },
    ]),
  ]);

  const badgeDistribution = [
    { badge: 'verified',           label: 'Verified',           count: verifiedCount       },
    { badge: 'top_rated',          label: 'Top Rated',          count: topRatedCount        },
    { badge: 'fast_responder',     label: 'Fast Responder',     count: fastResponderCount   },
    { badge: 'reliable_worker',    label: 'Reliable Worker',    count: reliableWorkerCount  },
    { badge: 'highly_experienced', label: 'Highly Experienced', count: highlyExpCount       },
    { badge: 'rising_star',        label: 'Rising Star',        count: risingStarCount      },
    { badge: 'premium_labour',     label: 'Premium Labour',     count: premiumCount         },
  ].map(b => ({ ...b, pct: totalProfiles > 0 ? Math.round((b.count / totalProfiles) * 100) : 0 }));

  successResponse(res, 200, 'Badge stats fetched', {
    totalProfiles,
    badgeDistribution,
    levelDistribution: levelDist,
    topScorers,
    flaggedRatingsCount,
    avgTrustScore: Math.round(avgTrustScore[0]?.avg || 0),
    unverifiedCount: totalProfiles - verifiedCount,
  });
});

// ─── Manually trigger badge recalculation for all profiles ────────────────────
const recalculateAll = asyncHandler(async (req, res) => {
  const profiles = await LabourProfile.find().select('_id');
  const io = req.app.locals.io;
  let done = 0;
  for (const p of profiles) {
    try {
      await badgeService.recalculate(p._id, io);
      done++;
    } catch (_) {}
  }
  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'badges_recalculated',
    description:`Triggered manual badge recalculation for all ${done} profiles.`,
    targetType: 'System',
    metadata:   { done, total: profiles.length },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `Recalculated ${done} profiles`, { done, total: profiles.length });
});

// ─── Inactive User Cleanup ───────────────────────────────────────────────────

const getInactiveUsers = asyncHandler(async (req, res) => {
  const { days = 90, type = 'all', page = 1, limit = 25 } = req.query;
  const skip     = (Number(page) - 1) * Number(limit);
  const cutoff   = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
  const regCutoff= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // registered 7+ days ago

  const filter = {
    role:      { $ne: 'admin' },
    isSuspended: false,
    createdAt: { $lte: regCutoff }, // exclude brand-new users
    $or: [
      { lastLogin: { $lt: cutoff } },              // not logged in
      { lastLogin: { $exists: false }, createdAt: { $lt: cutoff } }, // never logged in after registration
    ],
  };
  if (type === 'no_profile')  filter.isProfileComplete = false;
  if (type === 'inactive')    filter.isProfileComplete = true;
  if (type === 'never_login') { filter.lastLogin = { $exists: false }; delete filter.$or; }
  if (type === 'labour') filter.role = 'labour';
  if (type === 'client') filter.role = 'client';

  const [users, total, stats] = await Promise.all([
    User.find(filter)
      .select('name email role avatar createdAt lastLogin isProfileComplete isSuspended phone')
      .populate('labourProfile', 'skills completedJobs averageRating verificationStatus')
      .populate('clientProfile', 'companyName')
      .sort({ lastLogin: 1, createdAt: 1 }) // oldest first
      .skip(skip).limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
    User.aggregate([
      { $match: { role: { $ne: 'admin' }, isSuspended: false, createdAt: { $lte: regCutoff } } },
      { $group: {
        _id: null,
        noProfile:     { $sum: { $cond: [{ $eq: ['$isProfileComplete', false] }, 1, 0] } },
        inactive90:    { $sum: { $cond: [{ $or: [{ $lt: ['$lastLogin', cutoff] }, { $eq: [{ $type: '$lastLogin' }, 'missing'] }] }, 1, 0] } },
        neverLoggedIn: { $sum: { $cond: [{ $eq: [{ $type: '$lastLogin' }, 'missing'] }, 1, 0] } },
        total:         { $sum: 1 },
      }},
    ]),
  ]);

  // Enrich with inactivity details
  const enriched = users.map(u => {
    const daysSinceLogin = u.lastLogin
      ? Math.floor((Date.now() - new Date(u.lastLogin)) / 86400000)
      : Math.floor((Date.now() - new Date(u.createdAt)) / 86400000);
    const daysSinceReg = Math.floor((Date.now() - new Date(u.createdAt)) / 86400000);
    const risk = daysSinceLogin > 180 ? 'ghost' : daysSinceLogin > 90 ? 'dormant' : 'at_risk';
    return { ...u, daysSinceLogin, daysSinceReg, risk };
  });

  res.json({ success: true, data: enriched, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }, stats: stats[0] || {} });
});

// Send re-engagement email to inactive users
const sendReengagementEmail = asyncHandler(async (req, res) => {
  const { userIds, customMessage } = req.body;
  const sendEmail = require('../utils/sendEmail');
  const io = req.app.locals.io;

  if (!userIds?.length) { res.status(400); throw new Error('No users selected'); }
  if (userIds.length > 50) { res.status(400); throw new Error('Max 50 users per batch'); }

  const users = await User.find({ _id: { $in: userIds }, role: { $ne: 'admin' } }).select('name email role');
  let sent = 0, failed = 0;

  for (const user of users) {
    try {
      await sendEmail({
        to: user.email,
        subject: '👋 We miss you on Labour Connect!',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:16px;background:#fff">
            <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
              <h1 style="color:#fff;margin:0;font-size:20px">Labour Connect</h1>
              <p style="color:#fed7aa;margin:8px 0 0;font-size:14px">Smart Labour Hiring Platform</p>
            </div>
            <p style="color:#374151;font-size:15px">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#374151;font-size:15px">We noticed you haven't been active on Labour Connect recently. ${customMessage || "We'd love to have you back!"}</p>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin:20px 0">
              <p style="margin:0;font-size:14px;color:#9a3412"><strong>What's new:</strong> ${user.role === 'labour' ? '🔔 New job opportunities matching your skills are waiting!' : '👷 Verified skilled workers ready for your next project!'}</p>
            </div>
            <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px">Return to Labour Connect</a>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px">You're receiving this because you have an account on Labour Connect.</p>
          </div>
        `,
      });
      sent++;
    } catch (_) { failed++; }
  }

  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'custom',
    description:`Sent re-engagement emails to ${sent} inactive users (${failed} failed)`,
    metadata:   { sent, failed, total: users.length },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `Emails sent: ${sent} success, ${failed} failed`, { sent, failed });
});

// Bulk delete ghost accounts
const deleteGhostAccounts = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  if (!userIds?.length) { res.status(400); throw new Error('No users selected'); }
  if (userIds.length > 20) { res.status(400); throw new Error('Max 20 deletions per batch'); }

  const users = await User.find({ _id: { $in: userIds }, role: { $ne: 'admin' } }).select('name email role');
  let deleted = 0;

  for (const user of users) {
    try {
      if (user.role === 'labour' && user.labourProfile) await LabourProfile.findByIdAndDelete(user.labourProfile);
      if (user.role === 'client' && user.clientProfile) await ClientProfile.findByIdAndDelete(user.clientProfile);
      await User.findByIdAndDelete(user._id);
      deleted++;
    } catch (_) {}
  }

  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'user_deleted',
    description:`Bulk deleted ${deleted} ghost/inactive accounts`,
    metadata:   { deleted, userIds },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `${deleted} accounts deleted`, { deleted });
});

// ─── Verification SLA Tracker ─────────────────────────────────────────────────
const getVerificationSLA = asyncHandler(async (req, res) => {
  const { type = 'all' } = req.query;

  const labourFilter = { verificationStatus: 'pending' };
  const clientFilter = { verificationStatus: 'pending' };

  const [labourPending, clientPending, resolvedToday, avgResolutionTime] = await Promise.all([
    type !== 'client' ? LabourProfile.find(labourFilter)
      .populate('user', 'name email avatar phone createdAt')
      .sort({ 'aadhaarDoc.updatedAt': 1, updatedAt: 1 })
      .lean() : Promise.resolve([]),
    type !== 'labour' ? ClientProfile.find(clientFilter)
      .populate('user', 'name email avatar phone createdAt')
      .sort({ 'aadhaarDoc.updatedAt': 1, updatedAt: 1 })
      .lean() : Promise.resolve([]),
    // Resolved in last 24h
    Promise.all([
      LabourProfile.countDocuments({ verificationStatus: { $in: ['approved','rejected'] }, 'aadhaarDoc.reviewedAt': { $gte: new Date(Date.now() - 86400000) } }),
      ClientProfile.countDocuments({ verificationStatus: { $in: ['approved','rejected'] }, 'aadhaarDoc.reviewedAt': { $gte: new Date(Date.now() - 86400000) } }),
    ]).then(([l, c]) => l + c),
    // Average resolution time (hours) from last 50 resolved
    LabourProfile.aggregate([
      { $match: { verificationStatus: { $in: ['approved','rejected'] }, 'aadhaarDoc.reviewedAt': { $exists: true }, updatedAt: { $gte: new Date(Date.now() - 30*86400000) } } },
      { $project: { hours: { $divide: [{ $subtract: ['$aadhaarDoc.reviewedAt', '$updatedAt'] }, 3600000] } } },
      { $group: { _id: null, avg: { $avg: '$hours' } } },
    ]).then(r => Math.abs(Math.round(r[0]?.avg || 0))),
  ]);

  // Enrich with SLA data
  const enrich = (profiles, profileType) => profiles.map(p => {
    const submittedAt = p.aadhaarDoc?.updatedAt || p.updatedAt;
    const hoursWaiting = (Date.now() - new Date(submittedAt)) / 3600000;
    const slaStatus = hoursWaiting < 12 ? 'green' : hoursWaiting < 24 ? 'amber' : 'red';
    const slaLabel  = hoursWaiting < 12 ? 'On Time' : hoursWaiting < 24 ? 'Due Soon' : 'OVERDUE';
    const isBreached = hoursWaiting >= 24;
    return { ...p, profileType, hoursWaiting: Math.round(hoursWaiting * 10) / 10, slaStatus, slaLabel, isBreached, submittedAt };
  });

  const allPending = [
    ...enrich(labourPending, 'labour'),
    ...enrich(clientPending, 'client'),
  ].sort((a, b) => a.hoursWaiting - b.hoursWaiting); // oldest first

  const breached  = allPending.filter(p => p.slaStatus === 'red').length;
  const dueSoon   = allPending.filter(p => p.slaStatus === 'amber').length;
  const onTime    = allPending.filter(p => p.slaStatus === 'green').length;
  const slaRate   = allPending.length > 0 ? Math.round((onTime / allPending.length) * 100) : 100;

  successResponse(res, 200, 'SLA data fetched', {
    pending: allPending,
    stats: { total: allPending.length, breached, dueSoon, onTime, resolvedToday, avgResolutionTime, slaRate },
  });
});

// ─── Analytics Dashboard ─────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const days   = parseInt(period) || 30;
  const since  = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const Dispute = require('../models/disputeModel');

  // ── Helper: bucket by day ───────────────────────────────────────────────
  const dailyBucket = (from, to = new Date()) => {
    const buckets = [];
    const cur = new Date(from);
    cur.setHours(0,0,0,0);
    while (cur <= to) {
      buckets.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return buckets;
  };

  const [
    // User registrations per day
    usersByDay,
    // Jobs posted per day
    jobsByDay,
    // Applications per day
    appsByDay,
    // Completions per day
    completionsByDay,
    // Revenue (agreed wages) per day
    revenueByDay,
    // Job categories breakdown
    categoryBreakdown,
    // City activity heatmap
    cityActivity,
    // State activity
    stateActivity,
    // Overall platform health
    totalUsers,
    totalLabour,
    totalClients,
    activeLabour,
    totalJobs,
    openJobs,
    completedJobs,
    totalApps,
    hiredApps,
    totalRevenue,
    avgRating,
    // Verification funnel
    verificationFunnel,
    // Top cities
    topCities,
    // Active users this week
    activeThisWeek,
    // Disputes
    totalDisputes,
    resolvedDisputes,
    // Skill demand
    skillDemand,
    // Hourly activity pattern
    hourlyPattern,
    // Weekly pattern
    weeklyPattern,
    // Retention: users who posted/applied in last 7d and 30d
    recentlyActive7,
    recentlyActive30,
  ] = await Promise.all([
    // User registrations per day
    User.aggregate([
      { $match: { createdAt: { $gte: since }, role: { $ne: 'admin' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                  labour: { $sum: { $cond: [{ $eq: ['$role','labour'] },1,0] } },
                  client: { $sum: { $cond: [{ $eq: ['$role','client'] },1,0] } },
                  total:  { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Jobs posted per day
    Job.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Applications per day
    Job.aggregate([
      { $match: { 'applicants.0': { $exists: true } } },
      { $unwind: '$applicants' },
      { $match: { 'applicants.appliedAt': { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$applicants.appliedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Completions per day
    Job.aggregate([
      { $match: { status: 'completed', updatedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Revenue (agreed wages) per day from hired labourers
    Job.aggregate([
      { $match: { status: 'completed', updatedAt: { $gte: since }, 'hiredLabourers.0': { $exists: true } } },
      { $unwind: '$hiredLabourers' },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
                  revenue: { $sum: { $ifNull: ['$hiredLabourers.agreedWage', '$budgetMax'] } } } },
      { $sort: { _id: 1 } },
    ]),
    // Category breakdown
    Job.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$category',
                  total:     { $sum: 1 },
                  completed: { $sum: { $cond: [{ $eq: ['$status','completed'] },1,0] } },
                  open:      { $sum: { $cond: [{ $eq: ['$status','open'] },1,0] } },
                  avgBudget: { $avg: '$budgetMax' } } },
      { $sort: { total: -1 } },
    ]),
    // City activity
    Job.aggregate([
      { $match: { 'location.city': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.city', state: { $first: '$location.state' }, jobs: { $sum: 1 } } },
      { $sort: { jobs: -1 } },
      { $limit: 20 },
    ]),
    // State activity
    Job.aggregate([
      { $match: { 'location.state': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.state', jobs: { $sum: 1 } } },
      { $sort: { jobs: -1 } },
      { $limit: 10 },
    ]),
    // Totals
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ role: 'labour' }),
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'labour', updatedAt: { $gte: new Date(Date.now() - 7*86400000) } }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'open' }),
    Job.countDocuments({ status: 'completed' }),
    Job.aggregate([{ $group: { _id: null, total: { $sum: { $size: '$applicants' } } } }]),
    Job.aggregate([{ $group: { _id: null, total: { $sum: { $size: '$hiredLabourers' } } } }]),
    Job.aggregate([
      { $match: { status: 'completed', 'hiredLabourers.0': { $exists: true } } },
      { $unwind: '$hiredLabourers' },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$hiredLabourers.agreedWage','$budgetMax'] } } } },
    ]),
    LabourProfile.aggregate([{ $group: { _id: null, avg: { $avg: '$averageRating' } } }]),
    // Verification funnel
    LabourProfile.aggregate([
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
    ]),
    // Top cities by user count
    User.aggregate([
      { $match: { 'location.city': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.city', state: { $first: '$location.state' }, users: { $sum: 1 } } },
      { $sort: { users: -1 } },
      { $limit: 10 },
    ]),
    // Active this week
    User.countDocuments({ role: { $ne: 'admin' }, updatedAt: { $gte: new Date(Date.now() - 7*86400000) } }),
    // Disputes
    require('../models/disputeModel').countDocuments(),
    require('../models/disputeModel').countDocuments({ status: { $in: ['resolved','closed'] } }),
    // Skill demand
    Job.aggregate([
      { $unwind: '$requirements' },
      { $group: { _id: '$requirements.skill', count: { $sum: 1 }, avgWage: { $avg: '$budgetMax' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    // Hourly pattern (UTC hour when jobs are posted)
    Job.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Day of week pattern
    Job.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Recently active users last 7d
    User.countDocuments({ role: { $ne: 'admin' }, updatedAt: { $gte: new Date(Date.now() - 7*86400000) } }),
    // Recently active users last 30d
    User.countDocuments({ role: { $ne: 'admin' }, updatedAt: { $gte: new Date(Date.now() - 30*86400000) } }),
  ]);

  // Application success rate
  const totalAppsN  = totalApps[0]?.total  || 0;
  const totalHiredN = hiredApps[0]?.total  || 0;
  const successRate = totalAppsN > 0 ? Math.round((totalHiredN / totalAppsN) * 100) : 0;

  // Verification funnel map
  const verifMap = {};
  verificationFunnel.forEach(v => { verifMap[v._id] = v.count; });

  // Platform health score (0-100)
  const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const verifiedRate   = totalLabour > 0 ? Math.round((verifMap['approved'] || 0) / totalLabour * 100) : 0;
  const disputeRate    = totalJobs > 0 ? Math.round((totalDisputes / totalJobs) * 100) : 0;
  const healthScore    = Math.min(100, Math.round(
    (successRate * 0.3) + (completionRate * 0.3) + (verifiedRate * 0.2) + ((100 - Math.min(disputeRate * 5, 20)) * 0.2)
  ));

  // Retention rate
  const retentionRate7  = totalUsers > 0 ? Math.round((recentlyActive7  / totalUsers) * 100) : 0;
  const retentionRate30 = totalUsers > 0 ? Math.round((recentlyActive30 / totalUsers) * 100) : 0;

  successResponse(res, 200, 'Analytics fetched', {
    overview: {
      totalUsers, totalLabour, totalClients,
      activeLabour, activeThisWeek,
      totalJobs, openJobs, completedJobs,
      totalApps: totalAppsN, totalHired: totalHiredN,
      successRate, completionRate, verifiedRate,
      totalRevenue: totalRevenue[0]?.total || 0,
      avgRating: Math.round((avgRating[0]?.avg || 0) * 10) / 10,
      totalDisputes, resolvedDisputes,
      healthScore,
      retentionRate7, retentionRate30,
    },
    charts: {
      usersByDay, jobsByDay, appsByDay,
      completionsByDay, revenueByDay,
      categoryBreakdown, cityActivity, stateActivity,
      skillDemand, hourlyPattern, weeklyPattern,
    },
    funnels: {
      verification: verifMap,
      jobStatus: {
        open: openJobs,
        inProgress: await Job.countDocuments({ status: 'in_progress' }),
        completed: completedJobs,
        cancelled: await Job.countDocuments({ status: 'cancelled' }),
      },
      applicationFunnel: {
        applied: totalAppsN,
        shortlisted: await Job.aggregate([
          { $unwind: '$applicants' },
          { $match: { 'applicants.status': 'shortlisted' } },
          { $count: 'total' },
        ]).then(r => r[0]?.total || 0),
        accepted: totalHiredN,
      },
    },
    topCities,
    period: days,
  });
});

// ─── Audit Log ───────────────────────────────────────────────────────────────
const AuditLog = require('../models/auditLogModel');

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, category, action, severity, adminId, search, dateFrom, dateTo } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (category)  filter.category = category;
  if (action)    filter.action   = action;
  if (severity)  filter.severity = severity;
  if (adminId)   filter.adminId  = adminId;
  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: 'i' } },
      { targetName:  { $regex: search, $options: 'i' } },
      { adminName:   { $regex: search, $options: 'i' } },
    ];
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
  }

  const [logs, total, stats] = await Promise.all([
    AuditLog.find(filter)
      .populate('adminId', 'name avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AuditLog.countDocuments(filter),
    AuditLog.aggregate([
      { $group: {
        _id:      null,
        total:    { $sum: 1 },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        warning:  { $sum: { $cond: [{ $eq: ['$severity', 'warning']  }, 1, 0] } },
        info:     { $sum: { $cond: [{ $eq: ['$severity', 'info']     }, 1, 0] } },
        today:    { $sum: { $cond: [{ $gte: ['$createdAt', new Date(new Date().setHours(0,0,0,0))] }, 1, 0] } },
      }},
    ]),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    stats: stats[0] || {},
  });
});

// GET audit summary — for dashboard widget
const getAuditSummary = asyncHandler(async (req, res) => {
  const [byCat, byAdmin, recent] = await Promise.all([
    AuditLog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.aggregate([
      { $group: { _id: '$adminId', adminName: { $first: '$adminName' }, count: { $sum: 1 }, lastAction: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    AuditLog.find({ severity: { $in: ['critical', 'warning'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);
  successResponse(res, 200, 'Audit summary', { byCat, byAdmin, recent });
});

// ─── Get flagged ratings ──────────────────────────────────────────────────────
const getFlaggedRatings = asyncHandler(async (req, res) => {
  const Rating = require('../models/ratingModel');
  const { page, limit, skip } = require('../utils/apiResponse').getPaginationOptions
    ? require('../utils/apiResponse').getPaginationOptions(req.query)
    : { page: 1, limit: 20, skip: 0 };

  const [ratings, total] = await Promise.all([
    Rating.find({ isFlagged: true })
      .populate('ratedBy',   'name email role avatar')
      .populate('ratedUser', 'name email role avatar')
      .populate('job',       'title')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit),
    Rating.countDocuments({ isFlagged: true }),
  ]);

  res.json({ success: true, data: ratings, meta: { total, page, limit } });
});

// ─── Unflag a rating (admin decision: not actually fraudulent) ─────────────────
const unflagRating = asyncHandler(async (req, res) => {
  const Rating = require('../models/ratingModel');
  const rating = await Rating.findByIdAndUpdate(
    req.params.ratingId,
    { isFlagged: false, flagReason: null },
    { new: true }
  );
  if (!rating) { res.status(404); throw new Error('Rating not found'); }

  // Recalculate labour profile stats
  const LabourProfile = require('../models/labourProfileModel');
  const { recalculate } = require('../services/badgeService');
  const lp = await LabourProfile.findOne({ user: rating.ratedUser });
  if (lp) await recalculate(lp._id, req.app.locals.io);

  res.json({ success: true, message: 'Rating unflagged', data: rating });
});

// ─── Confirm flag and delete rating ───────────────────────────────────────────
const deleteFlaggedRating = asyncHandler(async (req, res) => {
  const Rating = require('../models/ratingModel');
  const rating = await Rating.findByIdAndDelete(req.params.ratingId);
  if (!rating) { res.status(404); throw new Error('Rating not found'); }

  // Recalculate
  const LabourProfile = require('../models/labourProfileModel');
  const { recalculate } = require('../services/badgeService');
  const lp = await LabourProfile.findOne({ user: rating.ratedUser });
  if (lp) await recalculate(lp._id, req.app.locals.io);

  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'rating_deleted',
    description:`Deleted fraudulent rating (${rating.overallRating}★) by "${rating.ratedBy}" on "${rating.ratedUser}". Reason: ${rating.flagReason || 'fraud'}`,
    targetType: 'Rating',
    targetId:   rating._id,
    metadata:   { overallRating: rating.overallRating, flagReason: rating.flagReason },
    ipAddress:  req.ip,
  });

// ─── @desc   Assign an employee to a user
// ─── @route  PUT /api/admin/users/:userId/assign-employee
// ─── @access Private (admin)
const assignEmployeeToUser = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  const user = await User.findById(req.params.userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'labour') {
    const profile = await LabourProfile.findOne({ user: user._id });
    if (profile) {
      profile.assignedEmployee = employeeId;
      await profile.save();
    }
  } else if (user.role === 'client') {
    const profile = await ClientProfile.findOne({ user: user._id });
    if (profile) {
      profile.assignedEmployee = employeeId;
      await profile.save();
    }
  } else {
    res.status(400);
    throw new Error('Can only assign employees to clients or labour');
  }

  const employee = await User.findById(employeeId);

  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'user_updated',
    description:`Assigned employee "${employee?.name || 'Unknown'}" to user "${user.name}"`,
    targetType: 'User',
    targetId:   user._id,
    targetName: user.name,
    metadata:   { employeeId, employeeName: employee?.name },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, 'Employee assigned successfully');
});

res.json({ success: true, message: 'Flagged rating deleted' });
});

// ─── @desc   Get all employees
// ─── @route  GET /api/admin/employees
// ─── @access Private (admin)
const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'employee' })
    .select('-password')
    .sort({ createdAt: -1 });
  
  successResponse(res, 200, 'Employees fetched', employees);
});

// ─── @desc   Create a new employee
// ─── @route  POST /api/admin/employees
// ─── @access Private (admin)
const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, phone, password, location } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email is already registered');
  }

  const employee = await User.create({
    name,
    email,
    phone,
    password,
    role: 'employee',
    isVerified: true,
    isProfileComplete: true,
    location
  });

  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'user_created',
    description:`Created new employee account: ${name} (${email})`,
    targetType: 'User',
    targetId:   employee._id,
    targetName: employee.name,
    ipAddress:  req.ip,
  });

  successResponse(res, 201, 'Employee created successfully', employee);
});

// @desc    Assign an employee (mediator) to a client or worker
// @route   PUT /api/admin/users/:userId/assign-mediator
// @access  Private (Admin)
const assignEmployeeToUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { employeeId } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'employee') {
    throw new Error('Valid employee not found');
  }

  if (user.role === 'labour') {
    let profile = await LabourProfile.findOne({ user: userId });
    if (!profile) profile = await LabourProfile.create({ user: userId });
    profile.assignedEmployee = employeeId;
    await profile.save();
  } else if (user.role === 'client') {
    let profile = await ClientProfile.findOne({ user: userId });
    if (!profile) profile = await ClientProfile.create({ user: userId });
    profile.assignedEmployee = employeeId;
    await profile.save();
  } else {
    throw new Error('Mediators can only be assigned to Clients or Workers');
  }

  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'user_assigned',
    description:`Assigned ${user.name} to mediator ${employee.name}`,
    targetType: 'User',
    targetId:   user._id,
    targetName: user.name,
    ipAddress:  req.ip,
  });

  successResponse(res, 200, `Successfully assigned ${user.name} to ${employee.name}`);
});

module.exports = {
  getAllEmployees,
  createEmployee,
  assignEmployeeToUser,
  getDashboardStats,
  getAllUsers,
  toggleUserSuspension,
  deleteUser,
  getPendingVerifications,
  reviewVerification,
  getAllJobsAdmin,
  getFlaggedRatings,
  getBadgeStats,
  getFraudJobs,
  getAuditLogs,
  getAnalytics,
  getInactiveUsers,
  sendReengagementEmail,
  deleteGhostAccounts,
  getVerificationSLA,
  getAuditSummary,
  runFraudScan,
  reviewFraudJob,
  getFraudStats,
  recalculateAll,
  unflagRating,
  deleteFlaggedRating,
};