// const asyncHandler   = require('express-async-handler');
// const Job            = require('../models/jobModel');
// const User           = require('../models/userModel');
// const Notification   = require('../models/notificationModel');
// const notifService   = require('../services/notificationService');
// const {
//   successResponse,
//   paginatedResponse,
//   getPaginationOptions,
// } = require('../utils/apiResponse');

// // ── Helper: safely parse JSON strings or objects ──────────────────────────────
// const safeParse = (val, fallback = []) => {
//   if (!val) return fallback;
//   if (typeof val === 'object') return val;
//   try { return JSON.parse(val); } catch { return fallback; }
// };

// // ─── CREATE JOB ───────────────────────────────────────────────────────────────
// const createJob = asyncHandler(async (req, res) => {
//   const {
//     title, description, category,
//     totalLabourNeeded, budgetType, budgetMin, budgetMax,
//     startDate, endDate, duration, isUrgent, isGroupJob,
//   } = req.body;

//   const location     = safeParse(req.body.location, {});
//   const requirements = safeParse(req.body.requirements, []);
//   const tags         = safeParse(req.body.tags, []);

//   if (!title || !description || !category) {
//     res.status(400); throw new Error('Title, description and category are required');
//   }
//   if (!location?.address || !location?.city) {
//     res.status(400); throw new Error('Location address and city are required');
//   }

//   const job = await Job.create({
//     title, description, category, requirements,
//     totalLabourNeeded: Number(totalLabourNeeded) || 1,
//     budgetType: budgetType || 'daily',
//     budgetMin:  Number(budgetMin),
//     budgetMax:  Number(budgetMax),
//     startDate,
//     endDate:    endDate   || undefined,
//     duration:   duration  || undefined,
//     location: {
//       type: 'Point',
//       coordinates: location.coordinates || [0, 0],
//       address:  location.address  || '',
//       city:     location.city     || '',
//       state:    location.state    || '',
//       pincode:  location.pincode  || '',
//     },
//     isUrgent:   Boolean(isUrgent),
//     isGroupJob: Boolean(isGroupJob),
//     tags,
//     postedBy: req.user._id,
//   });

//   // Emit real-time to all connected labourers
//   const io = req.app.locals.io;
//   if (io) {
//     io.emit('job:new', job.toObject());
//   }

//   successResponse(res, 201, 'Job posted successfully', job);
// });

// // ─── GET ALL JOBS (browse) ────────────────────────────────────────────────────
// const getJobs = asyncHandler(async (req, res) => {
//   const { page, limit, skip } = getPaginationOptions(req.query);
//   const {
//     category, status = 'open', city,
//     budgetMin, budgetMax, sortBy = 'createdAt',
//     order = 'desc', search, isUrgent,
//   } = req.query;

//   const filter = { status };
//   if (category) filter.category = category;
//   if (city)     filter['location.city'] = { $regex: city, $options: 'i' };
//   if (isUrgent) filter.isUrgent = isUrgent === 'true';
//   if (budgetMin) filter.budgetMin = { $gte: Number(budgetMin) };
//   if (budgetMax) filter.budgetMax = { $lte: Number(budgetMax) };
//   if (search) filter.$or = [
//     { title:       { $regex: search, $options: 'i' } },
//     { description: { $regex: search, $options: 'i' } },
//   ];

//   const [jobs, total] = await Promise.all([
//     Job.find(filter)
//       .populate('postedBy', 'name avatar location')
//       .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
//       .skip(skip).limit(limit).lean(),
//     Job.countDocuments(filter),
//   ]);

//   paginatedResponse(res, jobs, total, page, limit, 'Jobs fetched');
// });

// // ─── GET JOB BY ID ────────────────────────────────────────────────────────────
// const getJobById = asyncHandler(async (req, res) => {
//   const job = await Job.findById(req.params.id)
//     .populate('postedBy', 'name email phone avatar location clientProfile')
//     .populate('applicants.labour', 'name avatar');
//   if (!job) { res.status(404); throw new Error('Job not found'); }
//   successResponse(res, 200, 'Job fetched', job);
// });

// // ─── UPDATE JOB ───────────────────────────────────────────────────────────────
// const updateJob = asyncHandler(async (req, res) => {
//   const job = await Job.findById(req.params.id);
//   if (!job) { res.status(404); throw new Error('Job not found'); }
//   if (job.postedBy.toString() !== req.user._id.toString()) {
//     res.status(403); throw new Error('Not authorised');
//   }
//   if (['completed', 'cancelled'].includes(job.status)) {
//     res.status(400); throw new Error('Cannot edit a completed or cancelled job');
//   }

//   const updatable = ['title','description','category','requirements',
//     'totalLabourNeeded','budgetType','budgetMin','budgetMax',
//     'startDate','endDate','duration','location','isUrgent','isGroupJob','tags','status'];
//   updatable.forEach(k => { if (req.body[k] !== undefined) job[k] = req.body[k]; });
//   await job.save();

//   // Real-time update to all clients
//   const io = req.app.locals.io;
//   if (io) io.emit('job:updated', job.toObject());

//   successResponse(res, 200, 'Job updated', job);
// });

// // ─── DELETE JOB — notifies all applicants ────────────────────────────────────
// const deleteJob = asyncHandler(async (req, res) => {
//   const job = await Job.findById(req.params.id).populate('applicants.labour', 'name');
//   if (!job) { res.status(404); throw new Error('Job not found'); }

//   const isOwner = job.postedBy.toString() === req.user._id.toString();
//   const isAdmin = req.user.role === 'admin';
//   if (!isOwner && !isAdmin) { res.status(403); throw new Error('Not authorised'); }

//   // Notify all applicants who hadn't already been rejected/withdrawn
//   const io = req.app.locals.io;
//   const activeApplicants = job.applicants.filter(a =>
//     ['applied','shortlisted'].includes(a.status)
//   );

//   for (const app of activeApplicants) {
//     await notifService.createAndEmit({
//       userId:      app.labour._id,
//       senderName:  req.user.name || 'Labour Connect',
//       senderRole:  'client',
//       type:        'job_rejected',
//       category:    'job',
//       priority:    'high',
//       title:       '⚠️ Job Cancelled by Client',
//       description: `The job "${job.title}" has been cancelled by the client. Your application has been closed.`,
//       refModel:    null,
//       refId:       null,
//     });
//   }

//   // Mark job as cancelled instead of hard delete (so labour My Applications still shows it)
//   job.status = 'cancelled';
//   await job.save();

//   // Real-time update
//   if (io) io.emit('job:deleted', { jobId: job._id.toString() });

//   successResponse(res, 200, 'Job cancelled successfully');
// });

// // ─── APPLY TO JOB — notifies client ──────────────────────────────────────────
// const applyToJob = asyncHandler(async (req, res) => {
//   const job = await Job.findById(req.params.id).populate('postedBy', 'name _id');
//   if (!job) { res.status(404); throw new Error('Job not found'); }

//   // Guard: Only labour can apply
//   if (req.user.role !== 'labour') {
//     res.status(403); throw new Error('Only labour accounts can apply to jobs');
//   }

//   // Guard: Cannot apply to own job (shouldn't happen but safety check)
//   if (job.postedBy._id.toString() === req.user._id.toString()) {
//     res.status(400); throw new Error('You cannot apply to your own job posting');
//   }

//   // Guard: Job must be open
//   if (job.status === 'cancelled') {
//     res.status(400); throw new Error('This job has been cancelled and is no longer accepting applications');
//   }
//   if (job.status === 'completed') {
//     res.status(400); throw new Error('This job has been completed and is no longer accepting applications');
//   }
//   if (job.status === 'in_progress') {
//     res.status(400); throw new Error('This job is already in progress and not accepting new applications');
//   }
//   if (job.status !== 'open') {
//     res.status(400); throw new Error('This job is no longer accepting applications');
//   }

//   // Guard: Cannot apply twice
//   const alreadyApplied = job.applicants.find(
//     a => a.labour.toString() === req.user._id.toString()
//   );
//   if (alreadyApplied) {
//     res.status(400); throw new Error('You have already applied to this job. Check My Applications for status.');
//   }

//   // Guard: Validate wage if provided
//   const { proposedWage } = req.body;
//   if (proposedWage && Number(proposedWage) < 0) {
//     res.status(400); throw new Error('Wage cannot be negative');
//   }

//   job.applicants.push({
//     labour:       req.user._id,
//     proposalMsg:  req.body.proposalMsg  || '',
//     proposedWage: req.body.proposedWage || 0,
//     status:       'applied',
//     appliedAt:    new Date(),
//   });
//   await job.save();

//   // Notify the client
//   const io = req.app.locals.io;
//   await notifService.createAndEmit({
//     userId:           job.postedBy._id,
//     senderId:         req.user._id,
//     senderName:       req.user.name,
//     senderProfileUrl: req.user.avatar?.url || '',
//     senderRole:       'labour',
//     type:             'job_applied',
//     category:         'job',
//     priority:         'high',
//     title:            'New Job Application',
//     description:      `${req.user.name} applied for your job "${job.title}". Review their profile and respond.`,
//     refModel:         'Job',
//     refId:            job._id,
//     actionRequired:   true,
//     actions:          [{ label: 'View Applicants', type: 'view' }],
//   });

//   successResponse(res, 200, 'Application submitted', { jobId: job._id, status: 'applied' });
// });

// // ─── WITHDRAW APPLICATION ─────────────────────────────────────────────────────
// const withdrawApplication = asyncHandler(async (req, res) => {
//   const job = await Job.findById(req.params.id);
//   if (!job) { res.status(404); throw new Error('Job not found'); }

//   const idx = job.applicants.findIndex(
//     a => a.labour.toString() === req.user._id.toString()
//   );
//   if (idx === -1) { res.status(404); throw new Error('Application not found'); }
//   if (job.applicants[idx].status === 'accepted') {
//     res.status(400); throw new Error('Cannot withdraw after being accepted');
//   }

//   // If job is cancelled, just acknowledge (application already cancelled)
//   if (job.status === 'cancelled') {
//     return successResponse(res, 200, 'Job was already cancelled');
//   }

//   job.applicants.splice(idx, 1);
//   await job.save();

//   // Real-time: notify client that an applicant withdrew
//   const io = req.app.locals.io;
//   if (io) {
//     io.to(`user:${job.postedBy}`).emit('application:withdrawn', {
//       jobId:     job._id.toString(),
//       labourId:  req.user._id.toString(),
//       labourName:req.user.name,
//     });
//   }

//   successResponse(res, 200, 'Application withdrawn successfully');
// });

// // ─── UPDATE APPLICANT STATUS (accept/reject/shortlist) — notifies labour ──────
// const updateApplicantStatus = asyncHandler(async (req, res) => {
//   const { status, agreedWage } = req.body;
//   const job = await Job.findById(req.params.id);
//   if (!job) { res.status(404); throw new Error('Job not found'); }
//   if (job.postedBy.toString() !== req.user._id.toString()) {
//     res.status(403); throw new Error('Not authorised');
//   }

//   const applicant = job.applicants.find(
//     a => a.labour.toString() === req.params.labourId
//   );
//   if (!applicant) { res.status(404); throw new Error('Applicant not found'); }

//   // Guard: Cannot change status of a withdrawn application
//   if (applicant.status === 'withdrawn') {
//     res.status(400); throw new Error('Cannot update a withdrawn application');
//   }

//   // Guard: If already accepted, only allow completing the job (not re-rejecting)
//   if (applicant.status === 'accepted' && status === 'rejected') {
//     res.status(400); throw new Error('Cannot reject an already accepted application. Cancel the job instead.');
//   }

//   // Guard: Validate status value
//   const validStatuses = ['accepted', 'rejected', 'shortlisted'];
//   if (!validStatuses.includes(status)) {
//     res.status(400); throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
//   }

//   applicant.status = status;
//   if (status === 'accepted') {
//     job.hiredLabourers = job.hiredLabourers || [];
//     job.hiredLabourers.push({
//       labour:     req.params.labourId,
//       agreedWage: agreedWage || applicant.proposedWage,
//     });
//     if (job.status === 'open') job.status = 'in_progress';

//     // Track totalAcceptedJobs for completion rate denominator
//     try {
//       const LabourProfile = require('../models/labourProfileModel');
//       await LabourProfile.findOneAndUpdate(
//         { user: req.params.labourId },
//         { $inc: { totalAcceptedJobs: 1 } }
//       );
//     } catch (_) {}
//   }
//   await job.save();

//   // Notify the labour
//   const io = req.app.locals.io;
//   const statusMessages = {
//     accepted:    { title: '🎉 Application Accepted!',    desc: `You have been accepted for "${job.title}". Get ready to start work!`, priority: 'urgent' },
//     rejected:    { title: 'Application Update',          desc: `You were not selected for "${job.title}" this time. Keep applying!`,  priority: 'normal' },
//     shortlisted: { title: '⭐ You Are Shortlisted!',     desc: `You have been shortlisted for "${job.title}". Client will confirm soon.`, priority: 'high' },
//   };
//   const msg = statusMessages[status] || { title: 'Application Update', desc: `Status updated for "${job.title}"`, priority: 'normal' };

//   await notifService.createAndEmit({
//     userId:      req.params.labourId,
//     senderName:  req.user.name || 'Labour Connect',
//     senderRole:  'client',
//     type:        `job_${status}`,
//     category:    'job',
//     priority:    msg.priority,
//     title:       msg.title,
//     description: msg.desc,
//     refModel:    'Job',
//     refId:       job._id,
//   });

//   // Real-time status update to the labour's socket room
//   if (io) {
//     // Notify the specific labour about their application status
//     io.to(`user:${req.params.labourId}`).emit('application:statusUpdate', {
//       jobId:  job._id,
//       status,
//     });

//     // Notify the client (job owner) that job status may have changed
//     // e.g. open → in_progress when first labour accepted
//     io.to(`user:${job.postedBy}`).emit('job:statusChanged', {
//       jobId:     job._id.toString(),
//       jobStatus: job.status,
//     });
//   }

//   successResponse(res, 200, `Applicant ${status}`, job);
// });

// // ─── GET CLIENT'S POSTINGS ────────────────────────────────────────────────────
// const getMyJobPostings = asyncHandler(async (req, res) => {
//   const { page, limit, skip } = getPaginationOptions(req.query);
//   const { status } = req.query;

//   const filter = { postedBy: req.user._id };
//   if (status) filter.status = status;

//   const [jobs, total] = await Promise.all([
//     Job.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip).limit(limit)
//       .lean(),
//     Job.countDocuments(filter),
//   ]);

//   paginatedResponse(res, jobs, total, page, limit, 'My job postings');
// });

// // ─── GET LABOUR'S APPLICATIONS ────────────────────────────────────────────────
// const getMyApplications = asyncHandler(async (req, res) => {
//   const { page, limit, skip } = getPaginationOptions(req.query);
//   const Rating = require('../models/ratingModel');

//   const [jobs, total] = await Promise.all([
//     Job.find({ 'applicants.labour': req.user._id })
//       .select('title status category budgetMin budgetMax budgetType startDate location applicants postedBy createdAt')
//       .populate('postedBy', 'name avatar _id')
//       .sort({ createdAt: -1 })
//       .skip(skip).limit(limit),
//     Job.countDocuments({ 'applicants.labour': req.user._id }),
//   ]);

//   // Check which completed jobs this labour has already rated the client for
//   const completedJobIds = jobs
//     .filter(j => j.status === 'completed')
//     .map(j => j._id);

//   const existingRatings = completedJobIds.length > 0
//     ? await Rating.find({ ratedBy: req.user._id, job: { $in: completedJobIds } }).select('job')
//     : [];
//   const ratedJobIds = new Set(existingRatings.map(r => r.job.toString()));

//   const data = jobs.map(job => {
//     const myApp = job.applicants.find(
//       a => a.labour.toString() === req.user._id.toString()
//     );
//     return {
//       ...job.toObject(),
//       myApplication: myApp,
//       hasRatedClient: ratedJobIds.has(job._id.toString()),
//     };
//   });

//   paginatedResponse(res, data, total, page, limit, 'My applications');
// });


// // ─── COMPLETE A JOB — client marks job as done, triggers rating prompts ────────
// const completeJob = asyncHandler(async (req, res) => {
//   const job = await Job.findById(req.params.id)
//     .populate('hiredLabourers.labour', 'name _id');

//   if (!job) { res.status(404); throw new Error('Job not found'); }
//   if (job.postedBy.toString() !== req.user._id.toString()) {
//     res.status(403); throw new Error('Only the client can mark a job as completed');
//   }
//   if (job.status === 'completed') {
//     res.status(400); throw new Error('Job is already completed');
//   }
//   if (!['open', 'in_progress'].includes(job.status)) {
//     res.status(400); throw new Error('Cannot complete a cancelled job');
//   }

//   job.status = 'completed';
//   await job.save();

//   const io = req.app.locals.io;

//   // Notify each hired labour to rate the client
//   for (const hired of (job.hiredLabourers || [])) {
//     await notifService.createAndEmit({
//       userId:      hired.labour._id,
//       senderName:  'Labour Connect',
//       senderRole:  'system',
//       type:        'job_completed',
//       category:    'rating',
//       priority:    'normal',
//       title:       '✅ Job Completed — Please Rate the Client',
//       description: `"${job.title}" is marked as complete. Share your experience by rating the client.`,
//       refModel:    'Job',
//       refId:       job._id,
//       actionRequired: true,
//       actions:     [{ label: 'Rate Client', type: 'view' }],
//     });
//   }

//   // Broadcast job update
//   if (io) {
//     io.emit('job:updated', { _id: job._id.toString(), status: 'completed' });
//     io.to(`user:${job.postedBy}`).emit('job:statusChanged', {
//       jobId:     job._id.toString(),
//       jobStatus: 'completed',
//     });
//   }

//   // Recalculate badges + scores for all hired labourers
//   try {
//     const LabourProfile = require('../models/labourProfileModel');
//     const { recalculate }  = require('../services/badgeService');
//     for (const hired of (job.hiredLabourers || [])) {
//       const labourId = hired.labour?._id || hired.labour;
//       if (!labourId) continue;
//       const lp = await LabourProfile.findOne({ user: labourId });
//       if (!lp) continue;

//       // Increment counts
//       lp.completedJobs        = (lp.completedJobs        || 0) + 1;
//       lp.weeklyJobsCompleted  = (lp.weeklyJobsCompleted  || 0) + 1;
//       lp.monthlyJobsCompleted = (lp.monthlyJobsCompleted || 0) + 1;
//       lp.lastActiveAt         = new Date();

//       // Completion rate uses totalAcceptedJobs as denominator
//       const denominator = lp.totalAcceptedJobs || lp.completedJobs || 1;
//       lp.completionRate = Math.min(100, Math.round((lp.completedJobs / denominator) * 100));

//       await lp.save();
//       await recalculate(lp._id, io);
//     }
//   } catch (e) { console.error('Badge recalc error:', e.message); }

//   successResponse(res, 200, 'Job marked as completed', job);
// });


// // ── @desc   Get labour's work history map with clients
// // ── @route  GET /api/jobs/my-client-history
// // ── @access Private (labour)
// // Returns: { clientId: { count, statuses, lastWorked, ratings, jobs[] } }
// const getClientWorkHistory = asyncHandler(async (req, res) => {
//   const labourId = req.user._id;

//   // Find all jobs where this labour was hired, with completed or in_progress status
//   const workedJobs = await Job.find({
//     'hiredLabourers.labour': labourId,
//     status: { $in: ['completed', 'in_progress', 'cancelled'] },
//   })
//     .populate('postedBy', 'name avatar email phone')
//     .populate('labourRatings.labour', '_id')
//     .select('postedBy status title category updatedAt createdAt hiredLabourers budgetMax budgetType labourRatings')
//     .lean();

//   // Build per-client map
//   const historyMap = {};

//   for (const job of workedJobs) {
//     const clientId = job.postedBy?._id?.toString();
//     if (!clientId) continue;

//     if (!historyMap[clientId]) {
//       historyMap[clientId] = {
//         clientId,
//         client: {
//           name:   job.postedBy.name,
//           avatar: job.postedBy.avatar,
//           email:  job.postedBy.email,
//         },
//         totalJobs:       0,
//         completedJobs:   0,
//         inProgressJobs:  0,
//         cancelledJobs:   0,
//         lastWorked:      null,
//         firstWorked:     null,
//         categories:      [],
//         avgBudget:       0,
//         totalEarnings:   0,
//         hasRatedYou:     false,
//         recentJobTitle:  '',
//       };
//     }

//     const entry = historyMap[clientId];
//     entry.totalJobs++;

//     if (job.status === 'completed')   entry.completedJobs++;
//     if (job.status === 'in_progress') entry.inProgressJobs++;
//     if (job.status === 'cancelled')   entry.cancelledJobs++;

//     // Track dates
//     const jobDate = new Date(job.updatedAt || job.createdAt);
//     if (!entry.lastWorked  || jobDate > new Date(entry.lastWorked))  entry.lastWorked  = job.updatedAt;
//     if (!entry.firstWorked || jobDate < new Date(entry.firstWorked)) entry.firstWorked = job.createdAt;

//     // Track categories
//     if (job.category && !entry.categories.includes(job.category)) {
//       entry.categories.push(job.category);
//     }

//     // Track budget/earnings
//     entry.totalEarnings += job.budgetMax || 0;
//     entry.recentJobTitle = job.title;

//     // Check if client rated this labour in this job
//     const ratedByClient = job.labourRatings?.some(
//       r => r.labour?.toString() === labourId.toString()
//     );
//     if (ratedByClient) entry.hasRatedYou = true;
//   }

//   // Compute average budget per client
//   for (const entry of Object.values(historyMap)) {
//     entry.avgBudget = entry.totalJobs > 0
//       ? Math.round(entry.totalEarnings / entry.totalJobs)
//       : 0;
//     // Reliability score: higher = more reliable client
//     // Based on: completion rate, total jobs, recency
//     const daysSince = entry.lastWorked
//       ? Math.floor((Date.now() - new Date(entry.lastWorked)) / 86400000)
//       : 999;
//     const completionRate = entry.totalJobs > 0 ? entry.completedJobs / entry.totalJobs : 0;
//     entry.reliabilityScore = Math.round(
//       (completionRate * 60) +
//       (Math.min(entry.totalJobs, 10) * 3) +
//       (daysSince < 30 ? 10 : daysSince < 90 ? 5 : 0)
//     );
//   }

//   successResponse(res, 200, 'Client work history', historyMap);
// });

// module.exports = {
//   createJob,
//   getClientWorkHistory, getJobs, getJobById, updateJob, deleteJob, completeJob,
//   applyToJob, withdrawApplication, updateApplicantStatus,
//   getMyJobPostings, getMyApplications,
// };

const asyncHandler   = require('express-async-handler');
const Job            = require('../models/jobModel');
const User           = require('../models/userModel');
const Notification   = require('../models/notificationModel');
const notifService   = require('../services/notificationService');
const {
  successResponse,
  paginatedResponse,
  getPaginationOptions,
} = require('../utils/apiResponse');

// ── Helper: safely parse JSON strings or objects ──────────────────────────────
const safeParse = (val, fallback = []) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

// ─── CREATE JOB ───────────────────────────────────────────────────────────────
const createJob = asyncHandler(async (req, res) => {
  const {
    title, description, category,
    totalLabourNeeded, budgetType, budgetMin, budgetMax,
    startDate, endDate, duration, isUrgent, isGroupJob,
  } = req.body;

  const location     = safeParse(req.body.location, {});
  const requirements = safeParse(req.body.requirements, []);
  const tags         = safeParse(req.body.tags, []);

  if (!title || !description || !category) {
    res.status(400); throw new Error('Title, description and category are required');
  }
  if (!location?.address || !location?.city) {
    res.status(400); throw new Error('Location address and city are required');
  }

  // Calculate expiry date
  let expiresAt;
  if (endDate) {
    expiresAt = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000);
  } else if (startDate) {
    expiresAt = new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const job = await Job.create({
    title, description, category, requirements,
    totalLabourNeeded: Number(totalLabourNeeded) || 1,
    budgetType: budgetType || 'daily',
    budgetMin:  Number(budgetMin),
    budgetMax:  Number(budgetMax),
    startDate,
    endDate:    endDate   || undefined,
    duration:   duration  || undefined,
    expiresAt,
    location: {
      type: 'Point',
      coordinates: location.coordinates || [0, 0],
      address:  location.address  || '',
      city:     location.city     || '',
      state:    location.state    || '',
      pincode:  location.pincode  || '',
    },
    isUrgent:   Boolean(isUrgent),
    isGroupJob: Boolean(isGroupJob),
    tags,
    postedBy: req.user._id,
  });

  const io = req.app.locals.io;
  if (io) io.emit('job:new', job.toObject());

  successResponse(res, 201, 'Job posted successfully', job);
});

// ─── GET ALL JOBS (browse) ────────────────────────────────────────────────────
const getJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const {
    category, status = 'open', city,
    budgetMin, budgetMax, sortBy = 'createdAt',
    order = 'desc', search, isUrgent,
    includeExpired,
    savedBy,
  } = req.query;

  const filter = {};

// Status filter
if (status) {
  filter.status = status;
}

// Expiry handling
if (!includeExpired || includeExpired === 'false') {
  filter.expiresAt = { $gte: new Date() };
}

// Category
if (category) {
  filter.category = category;
}

// City
if (city) {
  filter['location.city'] = { $regex: `^${city}$`, $options: 'i' };
}

// Urgent
if (typeof isUrgent !== 'undefined') {
  filter.isUrgent = isUrgent === 'true';
}

// Budget
if (budgetMin || budgetMax) {
  filter.budgetMin = {};
  if (budgetMin) filter.budgetMin.$gte = Number(budgetMin);
  if (budgetMax) filter.budgetMin.$lte = Number(budgetMax);
}

// Search
if (search) {
  filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
}

// Saved
if (savedBy) {
  filter.savedBy = savedBy;
}

  const [jobsRaw, total] = await Promise.all([
  Job.find(filter)
    .populate({
      path: 'postedBy',
      select: 'name avatar location clientProfile',
      populate: {
        path: 'clientProfile',
        populate: { path: 'assignedEmployee', select: 'name avatar' }
      }
    })
    .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .lean(),
  Job.countDocuments(filter),
]);

// 🔥 Inject real-time expiry (IMPORTANT)
const now = new Date();

const jobs = jobsRaw.map(job => ({
  ...job,
  isExpired: job.expiresAt ? new Date(job.expiresAt) < now : false
}));

  paginatedResponse(res, jobs, total, page, limit, 'Jobs fetched');
});

// ─── GET JOB BY ID ────────────────────────────────────────────────────────────
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate({
      path: 'postedBy',
      select: 'name email phone avatar location clientProfile',
      populate: {
        path: 'clientProfile',
        populate: { path: 'assignedEmployee', select: 'name email phone' }
      }
    })
    .populate('applicants.labour', 'name avatar');
    
  if (!job) { res.status(404); throw new Error('Job not found'); }
  successResponse(res, 200, 'Job fetched', job);
});

// ─── SAVE JOB ───────────────────────────────────────────────────────────────────
const saveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }

  if (job.savedBy.includes(req.user._id)) {
    res.status(400); throw new Error('Job already saved');
  }

  job.savedBy.push(req.user._id);
  await job.save();

  successResponse(res, 200, 'Job saved successfully', { saved: true });
});

// ─── UNSAVE JOB ─────────────────────────────────────────────────────────────────
const unsaveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }

  job.savedBy = job.savedBy.filter(id => id.toString() !== req.user._id.toString());
  await job.save();

  successResponse(res, 200, 'Job removed from saved', { saved: false });
});

// ─── GET SAVED JOBS ─────────────────────────────────────────────────────────────
const getSavedJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);

  const filter = {
    savedBy: req.user._id,
    isExpired: { $ne: true },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ]
  };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('postedBy', 'name avatar location')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);

  paginatedResponse(res, jobs, total, page, limit, 'Saved jobs fetched');
});

// ─── UPDATE JOB ───────────────────────────────────────────────────────────────
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }
  if (job.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }
  if (['completed', 'cancelled', 'expired'].includes(job.status)) {
    res.status(400); throw new Error('Cannot edit a completed, cancelled or expired job');
  }

  const updatable = ['title','description','category','requirements',
    'totalLabourNeeded','budgetType','budgetMin','budgetMax',
    'startDate','endDate','duration','location','isUrgent','isGroupJob','tags','status'];
  updatable.forEach(k => { if (req.body[k] !== undefined) job[k] = req.body[k]; });

  if (req.body.endDate) {
    job.expiresAt = new Date(new Date(req.body.endDate).getTime() + 24 * 60 * 60 * 1000);
  }

  await job.save();

  const io = req.app.locals.io;
  if (io) io.emit('job:updated', job.toObject());

  successResponse(res, 200, 'Job updated', job);
});

// ─── DELETE JOB — notifies all applicants ────────────────────────────────────
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('applicants.labour', 'name');
  if (!job) { res.status(404); throw new Error('Job not found'); }

  const isOwner = job.postedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) { res.status(403); throw new Error('Not authorised'); }

  const io = req.app.locals.io;
  const activeApplicants = job.applicants.filter(a =>
    ['applied','shortlisted'].includes(a.status)
  );

  for (const app of activeApplicants) {
    await notifService.createAndEmit({
      userId:      app.labour._id,
      senderName:  req.user.name || 'Labour Connect',
      senderRole:  'client',
      type:        'job_rejected',
      category:    'job',
      priority:    'high',
      title:       '⚠️ Job Cancelled by Client',
      description: `The job "${job.title}" has been cancelled by the client. Your application has been closed.`,
      refModel:    null,
      refId:       null,
    });
  }

  job.status = 'cancelled';
  await job.save();

  if (io) io.emit('job:deleted', { jobId: job._id.toString() });

  successResponse(res, 200, 'Job cancelled successfully');
});

// ─── APPLY TO JOB — notifies client ──────────────────────────────────────────
const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name _id');
  if (!job) { res.status(404); throw new Error('Job not found'); }

  if (req.user.role !== 'labour') {
    res.status(403); throw new Error('Only labour accounts can apply to jobs');
  }

  if (job.postedBy._id.toString() === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot apply to your own job posting');
  }

  if (job.status === 'cancelled') {
    res.status(400); throw new Error('This job has been cancelled and is no longer accepting applications');
  }
  if (job.status === 'completed') {
    res.status(400); throw new Error('This job has been completed and is no longer accepting applications');
  }
  if (job.status === 'in_progress') {
    res.status(400); throw new Error('This job is already in progress and not accepting new applications');
  }
  if (job.status === 'expired' || job.isExpired) {
    res.status(400); throw new Error('This job has expired and is no longer accepting applications');
  }
  if (job.status !== 'open') {
    res.status(400); throw new Error('This job is no longer accepting applications');
  }

  const alreadyApplied = job.applicants.find(
    a => a.labour.toString() === req.user._id.toString()
  );
  if (alreadyApplied) {
    res.status(400); throw new Error('You have already applied to this job. Check My Applications for status.');
  }

  const { proposedWage } = req.body;
  if (proposedWage && Number(proposedWage) < 0) {
    res.status(400); throw new Error('Wage cannot be negative');
  }

  job.applicants.push({
    labour:       req.user._id,
    proposalMsg:  req.body.proposalMsg  || '',
    proposedWage: req.body.proposedWage || 0,
    status:       'applied',
    appliedAt:    new Date(),
  });
  await job.save();

  const io = req.app.locals.io;
  await notifService.createAndEmit({
    userId:           job.postedBy._id,
    senderId:         req.user._id,
    senderName:       req.user.name,
    senderProfileUrl: req.user.avatar?.url || '',
    senderRole:       'labour',
    type:             'job_applied',
    category:         'job',
    priority:         'high',
    title:            'New Job Application',
    description:      `${req.user.name} applied for your job "${job.title}". Review their profile and respond.`,
    refModel:         'Job',
    refId:            job._id,
    actionRequired:   true,
    actions:          [{ label: 'View Applicants', type: 'view' }],
  });

  successResponse(res, 200, 'Application submitted', { jobId: job._id, status: 'applied' });
});

// ─── WITHDRAW APPLICATION ─────────────────────────────────────────────────────
const withdrawApplication = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }

  const idx = job.applicants.findIndex(
    a => a.labour.toString() === req.user._id.toString()
  );
  if (idx === -1) { res.status(404); throw new Error('Application not found'); }
  if (job.applicants[idx].status === 'accepted') {
    res.status(400); throw new Error('Cannot withdraw after being accepted');
  }

  if (job.status === 'cancelled') {
    return successResponse(res, 200, 'Job was already cancelled');
  }

  job.applicants.splice(idx, 1);
  await job.save();

  const io = req.app.locals.io;
  if (io) {
    io.to(`user:${job.postedBy}`).emit('application:withdrawn', {
      jobId:     job._id.toString(),
      labourId:  req.user._id.toString(),
      labourName:req.user.name,
    });
  }

  successResponse(res, 200, 'Application withdrawn successfully');
});

// ─── UPDATE APPLICANT STATUS ──────────────────────────────────────────────────
const updateApplicantStatus = asyncHandler(async (req, res) => {
  const { status, agreedWage } = req.body;
  const job = await Job.findById(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }
  if (job.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }

  const applicant = job.applicants.find(
    a => a.labour.toString() === req.params.labourId
  );
  if (!applicant) { res.status(404); throw new Error('Applicant not found'); }

  if (applicant.status === 'withdrawn') {
    res.status(400); throw new Error('Cannot update a withdrawn application');
  }

  if (applicant.status === 'accepted' && status === 'rejected') {
    res.status(400); throw new Error('Cannot reject an already accepted application. Cancel the job instead.');
  }

  const validStatuses = ['accepted', 'rejected', 'shortlisted'];
  if (!validStatuses.includes(status)) {
    res.status(400); throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  applicant.status = status;
  if (status === 'accepted') {
    job.hiredLabourers = job.hiredLabourers || [];
    job.hiredLabourers.push({
      labour:     req.params.labourId,
      agreedWage: agreedWage || applicant.proposedWage,
    });
    if (job.status === 'open') job.status = 'in_progress';

    try {
      const LabourProfile = require('../models/labourProfileModel');
      await LabourProfile.findOneAndUpdate(
        { user: req.params.labourId },
        { $inc: { totalAcceptedJobs: 1 } }
      );
    } catch (_) {}
  }
  await job.save();

  const io = req.app.locals.io;
  const statusMessages = {
    accepted:    { title: '🎉 Application Accepted!',    desc: `You have been accepted for "${job.title}". Get ready to start work!`, priority: 'urgent' },
    rejected:    { title: 'Application Update',          desc: `You were not selected for "${job.title}" this time. Keep applying!`,  priority: 'normal' },
    shortlisted: { title: '⭐ You Are Shortlisted!',     desc: `You have been shortlisted for "${job.title}". Client will confirm soon.`, priority: 'high' },
  };
  const msg = statusMessages[status] || { title: 'Application Update', desc: `Status updated for "${job.title}"`, priority: 'normal' };

  await notifService.createAndEmit({
    userId:      req.params.labourId,
    senderName:  req.user.name || 'Labour Connect',
    senderRole:  'client',
    type:        `job_${status}`,
    category:    'job',
    priority:    msg.priority,
    title:       msg.title,
    description: msg.desc,
    refModel:    'Job',
    refId:       job._id,
  });

  if (io) {
    io.to(`user:${req.params.labourId}`).emit('application:statusUpdate', {
      jobId:  job._id,
      status,
    });

    io.to(`user:${job.postedBy}`).emit('job:statusChanged', {
      jobId:     job._id.toString(),
      jobStatus: job.status,
    });
  }

  successResponse(res, 200, `Applicant ${status}`, job);
});

// ─── GET CLIENT'S POSTINGS ────────────────────────────────────────────────────
const getMyJobPostings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { status } = req.query;

  const filter = { postedBy: req.user._id };
  if (status) filter.status = status;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  paginatedResponse(res, jobs, total, page, limit, 'My job postings');
});

// ─── GET LABOUR'S APPLICATIONS ────────────────────────────────────────────────
const getMyApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const Rating = require('../models/ratingModel');

  const [jobs, total] = await Promise.all([
    Job.find({ 'applicants.labour': req.user._id })
      .select('title status category budgetMin budgetMax budgetType startDate endDate expiresAt location applicants postedBy createdAt isExpired')
      .populate('postedBy', 'name avatar _id')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit),
    Job.countDocuments({ 'applicants.labour': req.user._id }),
  ]);

  const completedJobIds = jobs
    .filter(j => j.status === 'completed')
    .map(j => j._id);

  const existingRatings = completedJobIds.length > 0
    ? await Rating.find({ ratedBy: req.user._id, job: { $in: completedJobIds } }).select('job')
    : [];
  const ratedJobIds = new Set(existingRatings.map(r => r.job.toString()));

  const data = jobs.map(job => {
    const myApp = job.applicants.find(
      a => a.labour.toString() === req.user._id.toString()
    );
    return {
      ...job.toObject(),
      myApplication: myApp,
      hasRatedClient: ratedJobIds.has(job._id.toString()),
    };
  });

  paginatedResponse(res, data, total, page, limit, 'My applications');
});

// ─── COMPLETE A JOB ───────────────────────────────────────────────────────────
const completeJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('hiredLabourers.labour', 'name _id');

  if (!job) { res.status(404); throw new Error('Job not found'); }
  if (job.postedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the client can mark a job as completed');
  }
  if (job.status === 'completed') {
    res.status(400); throw new Error('Job is already completed');
  }
  if (!['open', 'in_progress'].includes(job.status)) {
    res.status(400); throw new Error('Cannot complete a cancelled job');
  }

  job.status = 'completed';
  await job.save();

  const io = req.app.locals.io;

  for (const hired of (job.hiredLabourers || [])) {
    await notifService.createAndEmit({
      userId:      hired.labour._id,
      senderName:  'Labour Connect',
      senderRole:  'system',
      type:        'job_completed',
      category:    'rating',
      priority:    'normal',
      title:       '✅ Job Completed — Please Rate the Client',
      description: `"${job.title}" is marked as complete. Share your experience by rating the client.`,
      refModel:    'Job',
      refId:       job._id,
      actionRequired: true,
      actions:     [{ label: 'Rate Client', type: 'view' }],
    });
  }

  if (io) {
    io.emit('job:updated', { _id: job._id.toString(), status: 'completed' });
    io.to(`user:${job.postedBy}`).emit('job:statusChanged', {
      jobId:     job._id.toString(),
      jobStatus: 'completed',
    });
  }

  try {
    const LabourProfile = require('../models/labourProfileModel');
    const { recalculate }  = require('../services/badgeService');
    for (const hired of (job.hiredLabourers || [])) {
      const labourId = hired.labour?._id || hired.labour;
      if (!labourId) continue;
      const lp = await LabourProfile.findOne({ user: labourId });
      if (!lp) continue;

      lp.completedJobs        = (lp.completedJobs        || 0) + 1;
      lp.weeklyJobsCompleted  = (lp.weeklyJobsCompleted  || 0) + 1;
      lp.monthlyJobsCompleted = (lp.monthlyJobsCompleted || 0) + 1;
      lp.lastActiveAt         = new Date();

      const denominator = lp.totalAcceptedJobs || lp.completedJobs || 1;
      lp.completionRate = Math.min(100, Math.round((lp.completedJobs / denominator) * 100));

      await lp.save();
      await recalculate(lp._id, io);
    }
  } catch (e) { console.error('Badge recalc error:', e.message); }

  successResponse(res, 200, 'Job marked as completed', job);
});

// ─── GET CLIENT WORK HISTORY ──────────────────────────────────────────────────
const getClientWorkHistory = asyncHandler(async (req, res) => {
  const labourId = req.user._id;

  const workedJobs = await Job.find({
    'hiredLabourers.labour': labourId,
    status: { $in: ['completed', 'in_progress', 'cancelled'] },
  })
    .populate('postedBy', 'name avatar email phone')
    .populate('labourRatings.labour', '_id')
    .select('postedBy status title category updatedAt createdAt hiredLabourers budgetMax budgetType labourRatings')
    .lean();

  const historyMap = {};

  for (const job of workedJobs) {
    const clientId = job.postedBy?._id?.toString();
    if (!clientId) continue;

    if (!historyMap[clientId]) {
      historyMap[clientId] = {
        clientId,
        client: {
          name:   job.postedBy.name,
          avatar: job.postedBy.avatar,
          email:  job.postedBy.email,
        },
        totalJobs:       0,
        completedJobs:   0,
        inProgressJobs:  0,
        cancelledJobs:   0,
        lastWorked:      null,
        firstWorked:     null,
        categories:      [],
        avgBudget:       0,
        totalEarnings:   0,
        hasRatedYou:     false,
        recentJobTitle:  '',
      };
    }

    const entry = historyMap[clientId];
    entry.totalJobs++;

    if (job.status === 'completed')   entry.completedJobs++;
    if (job.status === 'in_progress') entry.inProgressJobs++;
    if (job.status === 'cancelled')   entry.cancelledJobs++;

    const jobDate = new Date(job.updatedAt || job.createdAt);
    if (!entry.lastWorked  || jobDate > new Date(entry.lastWorked))  entry.lastWorked  = job.updatedAt;
    if (!entry.firstWorked || jobDate < new Date(entry.firstWorked)) entry.firstWorked = job.createdAt;

    if (job.category && !entry.categories.includes(job.category)) {
      entry.categories.push(job.category);
    }

    entry.totalEarnings += job.budgetMax || 0;
    entry.recentJobTitle = job.title;

    const ratedByClient = job.labourRatings?.some(
      r => r.labour?.toString() === labourId.toString()
    );
    if (ratedByClient) entry.hasRatedYou = true;
  }

  for (const entry of Object.values(historyMap)) {
    entry.avgBudget = entry.totalJobs > 0
      ? Math.round(entry.totalEarnings / entry.totalJobs)
      : 0;
    const daysSince = entry.lastWorked
      ? Math.floor((Date.now() - new Date(entry.lastWorked)) / 86400000)
      : 999;
    const completionRate = entry.totalJobs > 0 ? entry.completedJobs / entry.totalJobs : 0;
    entry.reliabilityScore = Math.round(
      (completionRate * 60) +
      (Math.min(entry.totalJobs, 10) * 3) +
      (daysSince < 30 ? 10 : daysSince < 90 ? 5 : 0)
    );
  }

  successResponse(res, 200, 'Client work history', historyMap);
});

module.exports = {
  createJob,
  getClientWorkHistory, 
  getJobs, 
  getJobById, 
  updateJob, 
  deleteJob, 
  completeJob,
  applyToJob, 
  withdrawApplication, 
  updateApplicantStatus,
  getMyJobPostings, 
  getMyApplications,
  saveJob,
  unsaveJob,
  getSavedJobs,
};