// /**
//  * Cron Service — Scheduled jobs for Labour Connect
//  *
//  * Jobs:
//  *  1. Every Monday 00:00 — Reset weeklyJobsCompleted for all labour profiles
//  *  2. Every 1st of month 00:00 — Reset monthlyJobsCompleted
//  *  3. Every Sunday 23:59 — Calculate weekly winner
//  *
//  * Uses node-cron (no external dependency needed if not installed — fallback to setInterval)
//  */

// const LabourProfile = require('../models/labourProfileModel');

// let _io = null;
// const setIO = (io) => { _io = io; };

// /* ── Weekly reset ────────────────────────────────────────────────────────── */
// const resetWeekly = async () => {
//   try {
//     const result = await LabourProfile.updateMany(
//       {},
//       {
//         $set: {
//           weeklyJobsCompleted: 0,
//           weeklyReset: new Date(),
//         }
//       }
//     );
//     console.log(`📅 Weekly reset complete — ${result.modifiedCount} profiles updated`);

//     // Notify clients of leaderboard reset
//     if (_io) _io.emit('leaderboard:weekly-reset');
//   } catch (err) {
//     console.error('❌ Weekly reset failed:', err.message);
//   }
// };

// /* ── Monthly reset ───────────────────────────────────────────────────────── */
// const resetMonthly = async () => {
//   try {
//     const result = await LabourProfile.updateMany(
//       {},
//       {
//         $set: {
//           monthlyJobsCompleted: 0,
//           monthlyReset: new Date(),
//         }
//       }
//     );
//     console.log(`📅 Monthly reset complete — ${result.modifiedCount} profiles updated`);
//     if (_io) _io.emit('leaderboard:monthly-reset');
//   } catch (err) {
//     console.error('❌ Monthly reset failed:', err.message);
//   }
// };

// /* ── Weekly winner calculation ───────────────────────────────────────────── */
// const calculateWeeklyWinner = async () => {
//   try {
//     const winner = await LabourProfile.findOne({ weeklyJobsCompleted: { $gt: 0 } })
//       .populate('user', 'name avatar')
//       .sort({ weeklyJobsCompleted: -1, averageRating: -1 })
//       .lean();

//     if (winner && _io) {
//       _io.emit('leaderboard:weekly-winner', {
//         name:                winner.user?.name,
//         avatar:              winner.user?.avatar,
//         weeklyJobsCompleted: winner.weeklyJobsCompleted,
//         averageRating:       winner.averageRating,
//         score:               winner.score,
//       });
//       console.log(`🏆 Weekly winner: ${winner.user?.name} (${winner.weeklyJobsCompleted} jobs)`);
//     }
//   } catch (err) {
//     console.error('❌ Weekly winner calc failed:', err.message);
//   }
// };

// /* ── Schedule using setInterval (no node-cron dependency) ───────────────── */
// const startCronJobs = () => {
//   // Check every hour whether a reset is due
//   setInterval(async () => {
//     const now = new Date();

//     // Weekly reset: Monday at 00:xx
//     if (now.getDay() === 1 && now.getHours() === 0) {
//       // Check if already reset this week
//       const recentReset = await LabourProfile.findOne({
//         weeklyReset: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
//       });
//       if (!recentReset) {
//         console.log('📅 Triggering weekly reset...');
//         await calculateWeeklyWinner(); // Calculate winner BEFORE reset
//         await resetWeekly();
//       }
//     }

//     // Monthly reset: 1st of month at 00:xx
//     if (now.getDate() === 1 && now.getHours() === 0) {
//       const recentReset = await LabourProfile.findOne({
//         monthlyReset: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
//       });
//       if (!recentReset) {
//         console.log('📅 Triggering monthly reset...');
//         await resetMonthly();
//       }
//     }
//   }, 60 * 60 * 1000); // check every hour

//   console.log('⏰ Cron jobs scheduled (weekly + monthly resets)');
// };

// /* ── Manual trigger endpoints (for testing) ─────────────────────────────── */
// const triggerWeeklyReset  = resetWeekly;
// const triggerMonthlyReset = resetMonthly;
// const triggerWeeklyWinner = calculateWeeklyWinner;

// module.exports = {
//   startCronJobs,
//   setIO,
//   triggerWeeklyReset,
//   triggerMonthlyReset,
//   triggerWeeklyWinner,
// };

const LabourProfile = require('../models/labourProfileModel');
const Job = require('../models/jobModel');
const notifService = require('./notificationService');

let _io = null;
const setIO = (io) => { _io = io; };

const resetWeekly = async () => {
  try {
    const result = await LabourProfile.updateMany(
      {},
      {
        $set: {
          weeklyJobsCompleted: 0,
          weeklyReset: new Date(),
        }
      }
    );
    console.log(`📅 Weekly reset complete — ${result.modifiedCount} profiles updated`);
    if (_io) _io.emit('leaderboard:weekly-reset');
  } catch (err) {
    console.error('❌ Weekly reset failed:', err.message);
  }
};

const resetMonthly = async () => {
  try {
    const result = await LabourProfile.updateMany(
      {},
      {
        $set: {
          monthlyJobsCompleted: 0,
          monthlyReset: new Date(),
        }
      }
    );
    console.log(`📅 Monthly reset complete — ${result.modifiedCount} profiles updated`);
    if (_io) _io.emit('leaderboard:monthly-reset');
  } catch (err) {
    console.error('❌ Monthly reset failed:', err.message);
  }
};

const calculateWeeklyWinner = async () => {
  try {
    const winner = await LabourProfile.findOne({ weeklyJobsCompleted: { $gt: 0 } })
      .populate('user', 'name avatar')
      .sort({ weeklyJobsCompleted: -1, averageRating: -1 })
      .lean();

    if (winner && _io) {
      _io.emit('leaderboard:weekly-winner', {
        name:                winner.user?.name,
        avatar:              winner.user?.avatar,
        weeklyJobsCompleted: winner.weeklyJobsCompleted,
        averageRating:       winner.averageRating,
        score:               winner.score,
      });
      console.log(`🏆 Weekly winner: ${winner.user?.name} (${winner.weeklyJobsCompleted} jobs)`);
    }
  } catch (err) {
    console.error('❌ Weekly winner calc failed:', err.message);
  }
};

const checkExpiredJobs = async () => {
  try {
    const now = new Date();
    
    const expiredJobs = await Job.find({
      expiresAt: { $lte: now },
      isExpired: false,
      status: { $in: ['open', 'in_progress'] }
    }).populate('postedBy', 'name');

    if (expiredJobs.length > 0) {
      console.log(`⏰ Found ${expiredJobs.length} expired jobs to process`);
      
      for (const job of expiredJobs) {
        job.isExpired = true;
        job.status = 'expired';
        job.expiredAt = now;
        await job.save();

        await notifService.createAndEmit({
          userId: job.postedBy._id,
          senderName: 'Labour Connect',
          senderRole: 'system',
          type: 'job_expired',
          category: 'job',
          priority: 'high',
          title: '⏰ Job Expired — Application Period Ended',
          description: `Your job "${job.title}" has expired.`,
          refModel: 'Job',
          refId: job._id,
        });

        if (_io) {
          // ✅ FIX: send full job data including expiresAt
          _io.emit('job:expired', {
            jobId: job._id.toString(),
            expiresAt: job.expiresAt,
            status: 'expired'
          });

          _io.to(`user:${job.postedBy._id}`).emit('job:statusChanged', {
            jobId: job._id.toString(),
            jobStatus: 'expired'
          });
        }
      }
      
      console.log(`✅ Processed ${expiredJobs.length} expired jobs`);
    }
  } catch (err) {
    console.error('❌ Expiry check failed:', err.message);
  }
};

const checkExpiringSoon = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const expiringJobs = await Job.find({
      expiresAt: { $gte: now, $lte: tomorrow },
      isExpired: false,
      expiryNotified: false,
      status: 'open',
      'applicants.0': { $exists: true }
    }).populate('postedBy', 'name');

    if (expiringJobs.length > 0) {
      console.log(`⚠️ Found ${expiringJobs.length} jobs expiring in 24h`);
      
      for (const job of expiringJobs) {
        job.expiryNotified = true;
        await job.save();

        await notifService.createAndEmit({
          userId: job.postedBy._id,
          senderName: 'Labour Connect',
          senderRole: 'system',
          type: 'job_expiring_soon',
          category: 'job',
          priority: 'urgent',
          title: '⚠️ Job Expires in 24 Hours',
          description: `Your job "${job.title}" expires tomorrow.`,
          refModel: 'Job',
          refId: job._id,
        });

        if (_io) {
          _io.to(`user:${job.postedBy._id}`).emit('job:expiring-soon', {
            jobId: job._id.toString(),
            title: job.title,
            expiresAt: job.expiresAt
          });
        }
      }
      
      console.log(`✅ Sent 24h warnings for ${expiringJobs.length} jobs`);
    }
  } catch (err) {
    console.error('❌ Expiring soon check failed:', err.message);
  }
};

const startCronJobs = () => {

  // ✅ FIX: run immediately on server start
  checkExpiredJobs();
  checkExpiringSoon();

  setInterval(async () => {
    const now = new Date();

    if (now.getDay() === 1 && now.getHours() === 0) {
      const recentReset = await LabourProfile.findOne({
        weeklyReset: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      });
      if (!recentReset) {
        console.log('📅 Triggering weekly reset...');
        await calculateWeeklyWinner();
        await resetWeekly();
      }
    }

    if (now.getDate() === 1 && now.getHours() === 0) {
      const recentReset = await LabourProfile.findOne({
        monthlyReset: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      });
      if (!recentReset) {
        console.log('📅 Triggering monthly reset...');
        await resetMonthly();
      }
    }
  }, 60 * 60 * 1000);

  // ✅ FIX: reduced interval (15 min → 1 min)
  setInterval(async () => {
    await checkExpiredJobs();
  }, 60 * 1000);

  setInterval(async () => {
    await checkExpiringSoon();
  }, 60 * 60 * 1000);

  console.log('⏰ Cron jobs scheduled (weekly + monthly resets + job expiry checks)');
};

const triggerWeeklyReset  = resetWeekly;
const triggerMonthlyReset = resetMonthly;
const triggerWeeklyWinner = calculateWeeklyWinner;
const triggerExpiryCheck  = checkExpiredJobs;
const triggerExpiringSoon = checkExpiringSoon;

module.exports = {
  startCronJobs,
  setIO,
  triggerWeeklyReset,
  triggerMonthlyReset,
  triggerWeeklyWinner,
  triggerExpiryCheck,
  triggerExpiringSoon,
};