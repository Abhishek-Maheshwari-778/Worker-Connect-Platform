// const asyncHandler   = require('express-async-handler');
// const { recalculate, detectFraud } = require('../services/badgeService');
// const notifService  = require('../services/notificationService');
// const User          = require('../models/userModel');
// const Rating        = require('../models/ratingModel');
// const Job           = require('../models/jobModel');
// const LabourProfile = require('../models/labourProfileModel');
// const ClientProfile = require('../models/clientProfileModel');
// const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

// /**
//  * Recompute and persist the average rating for a user's profile.
//  */
// const recalculateAverageRating = async (userId, type) => {
//   // Only count non-flagged ratings for the average
//   const ratings = await Rating.find({ ratedUser: userId, type, isFlagged: { $ne: true } });
//   if (ratings.length === 0) return;

//   const avg = ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length;
//   const roundedAvg = Math.round(avg * 10) / 10;

//   if (type === 'client_to_labour') {
//     await LabourProfile.findOneAndUpdate(
//       { user: userId },
//       { averageRating: roundedAvg, validRatings: ratings.length }
//     );
//   } else {
//     await ClientProfile.findOneAndUpdate(
//       { user: userId },
//       { averageRating: roundedAvg, totalRatings: ratings.length }
//     );
//   }
// };

// // ─── @desc   Submit a rating
// // ─── @route  POST /api/ratings
// // ─── @access Private
// const submitRating = asyncHandler(async (req, res) => {
//   const {
//     jobId, ratedUserId, overallRating, review,
//     workQuality, punctuality, behaviour, communication,
//     paymentReliability, workEnvironment,
//   } = req.body;

//   // ── Validate required fields ─────────────────────────────
//   if (!jobId || !ratedUserId || !overallRating) {
//     res.status(400);
//     throw new Error('jobId, ratedUserId and overallRating are required');
//   }

//   const job = await Job.findById(jobId);
//   if (!job) {
//     res.status(404);
//     throw new Error('Job not found');
//   }

//   const ratedUser = await User.findById(ratedUserId);
//   if (!ratedUser) {
//     res.status(404);
//     throw new Error('Rated user not found');
//   }

//   // ── Prevent self rating ─────────────────────────────────
//   if (req.user._id.toString() === ratedUserId) {
//     res.status(400);
//     throw new Error('You cannot rate yourself');
//   }

//   // ── Check duplicate rating BEFORE create ────────────────
//   const alreadyRated = await Rating.findOne({
//     job: jobId,
//     ratedBy: req.user._id,
//     ratedUser: ratedUserId,
//   });

//   if (alreadyRated) {
//     res.status(400);
//     throw new Error('You have already rated this user for this job');
//   }

//   // ── Determine type ──────────────────────────────────────
//   const isClient = req.user.role === 'client';
//   const type = isClient ? 'client_to_labour' : 'labour_to_client';

//   // ── Validate participation ──────────────────────────────
//   if (isClient && job.postedBy.toString() !== req.user._id.toString()) {
//     res.status(403);
//     throw new Error('You are not the client for this job');
//   }

//   if (!isClient) {
//     const wasHired = job.hiredLabourers.some(
//       (h) => h.labour.toString() === req.user._id.toString()
//     );
//     if (!wasHired) {
//       res.status(403);
//       throw new Error('You were not hired for this job');
//     }
//   }

//   if (job.status !== 'completed') {
//     res.status(400);
//     throw new Error('Ratings allowed only after job completion');
//   }

//   // ── Fraud detection ─────────────────────────────────────
//   const fraudCheck = await detectFraud({
//     ratedBy: req.user._id,
//     ratedUser: ratedUserId,
//     job: jobId,
//     overallRating,
//   });

//   // ── Create rating safely ────────────────────────────────
//   let rating;
//   try {
//     rating = await Rating.create({
//       job: jobId,
//       ratedBy: req.user._id,
//       ratedUser: ratedUserId,
//       type,
//       overallRating,
//       review,
//       ...(isClient && { workQuality, punctuality, behaviour, communication }),
//       ...(!isClient && { paymentReliability, workEnvironment }),
//       ...(fraudCheck.flagged && {
//         isFlagged: true,
//         flagReason: fraudCheck.reason,
//         flaggedAt: new Date(),
//       }),
//     });
//   } catch (err) {
//     // Handle duplicate key error cleanly
//     if (err.code === 11000) {
//       res.status(400);
//       throw new Error('You already submitted a rating for this job');
//     }
//     throw err;
//   }

//   // ── Update average rating ───────────────────────────────
//   await recalculateAverageRating(ratedUserId, type);

//   // ── Notification ────────────────────────────────────────
//   const rater = await User.findById(req.user._id).select('name avatar');

//   await notifService.createAndEmit({
//     userId: ratedUserId,
//     senderId: req.user._id,
//     senderName: rater.name,
//     senderProfileUrl: rater.avatar?.url || '',
//     senderRole: req.user.role,
//     type: 'rating_received',
//     category: 'rating',
//     priority: 'normal',
//     title: `⭐ New Rating — ${overallRating}/5`,
//     description: `${rater.name} rated you ${overallRating}/5 for "${job.title}"`,
//     refModel: 'Job',
//     refId: jobId,
//   });

//   // ── Badge recalculation ─────────────────────────────────
//   try {
//     if (ratedUser.role === 'labour') {
//       const lp = await LabourProfile.findOne({ user: ratedUser._id });
//       if (lp) await recalculate(lp._id, req.app.locals.io);
//     }
//   } catch (e) {
//     console.error('Badge recalc error:', e.message);
//   }

//   successResponse(res, 201, 'Rating submitted successfully', rating);
// });

// // ─── @desc   Get ratings for a user
// // ─── @route  GET /api/ratings/user/:userId
// // ─── @access Public
// const getUserRatings = asyncHandler(async (req, res) => {
//   const { page, limit, skip } = getPaginationOptions(req.query);
//   const { type } = req.query;

//   const filter = { ratedUser: req.params.userId, isPublic: true };
//   if (type) filter.type = type;

//   const [ratings, total] = await Promise.all([
//     Rating.find(filter)
//       .populate('ratedBy', 'name avatar role')
//       .populate('job', 'title category')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit),
//     Rating.countDocuments(filter),
//   ]);

//   paginatedResponse(res, ratings, total, page, limit, 'Ratings fetched');
// });

// // ─── Check if user already rated for a specific job ──────────────────────────
// const checkRating = asyncHandler(async (req, res) => {
//   const { jobId, ratedUserId } = req.query;
//   const existing = await Rating.findOne({
//     job:      jobId,
//     ratedBy:  req.user._id,
//     ratedUser:ratedUserId,
//   });
//   successResponse(res, 200, 'Check complete', { hasRated: !!existing });
// });

// module.exports = { submitRating, getUserRatings, checkRating };

const Rating = require('../models/ratingModel');
const Job    = require('../models/jobModel');

/* ── Create rating ────────────────────────────────────── */
const createRating = async (req, res) => {
  try {
    const {
      ratedUserId,
      overallRating,
      review,
      jobId,
      ...extra
    } = req.body;

    // ❗ Validate job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({
        message: 'You can only rate after job completion',
      });
    }

    // ❗ Prevent duplicate rating
    const existing = await Rating.findOne({
      ratedBy: req.user._id,
      ratedUser: ratedUserId,
      job: jobId,
    });

    if (existing) {
      return res.status(400).json({
        message: 'You have already rated this user for this job',
      });
    }

    // ❗ Ensure user is part of job
    const isParticipant =
      job.postedBy.toString() === req.user._id.toString() ||
      job.applicants.some(a =>
        a.labour.toString() === req.user._id.toString()
      );

    if (!isParticipant) {
      return res.status(403).json({
        message: 'You are not part of this job',
      });
    }

    // ❗ Prevent self-rating (extra safety)
    if (req.user._id.toString() === ratedUserId.toString()) {
      return res.status(400).json({
        message: 'Self rating is not allowed',
      });
    }

    // ✅ Create rating
    const rating = await Rating.create({
      ratedBy: req.user._id,
      ratedUser: ratedUserId,
      rating: overallRating,
      review,
      job: jobId,
      ...extra,
    });

    res.status(201).json({
      success: true,
      data: rating,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message || 'Failed to create rating',
    });
  }
};

/* ── Get user ratings ────────────────────────────────────── */
const getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({
      ratedUser: req.params.userId,
    })
      .populate('ratedBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ratings,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRating,
  getUserRatings,
};