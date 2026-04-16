const asyncHandler   = require('express-async-handler');
const Dispute        = require('../models/disputeModel');
const Job            = require('../models/jobModel');
const User           = require('../models/userModel');
const notifService   = require('../services/notificationService');
const auditService   = require('../services/auditService');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

// ── Helpers ───────────────────────────────────────────────────────────────────
const addTimeline = (dispute, event, actor, actorRole, note = '') => {
  dispute.timeline.push({ event, actor, actorRole, note, createdAt: new Date() });
};

const notifyParty = async (userId, title, description, disputeId, io, priority = 'high') => {
  await notifService.createAndEmit({
    userId,
    senderName:  'Labour Connect Support',
    senderRole:  'admin',
    type:        'system_alert',
    category:    'alert',
    priority,
    title,
    description,
    refModel:    'Dispute',
    refId:       disputeId,
    actionRequired: true,
  });
  if (io) io.to(`user:${userId}`).emit('dispute:update', { disputeId });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes — raise a new dispute
// ─────────────────────────────────────────────────────────────────────────────
const raiseDispute = asyncHandler(async (req, res) => {
  const { jobId, againstUserId, type, title, description, amount } = req.body;
  const io = req.app.locals.io;

  // Validate job exists and user was involved
  const job = await Job.findById(jobId).populate('postedBy', 'name _id').lean();
  if (!job) { res.status(404); throw new Error('Job not found'); }

  const isClient = req.user.role === 'client';
  const isLabour = req.user.role === 'labour';

  // Verify the raiser was part of this job
  if (isClient && job.postedBy._id.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You are not the client for this job');
  }
  if (isLabour) {
    const wasHired = job.hiredLabourers?.some(h =>
      (h.labour?._id || h.labour)?.toString() === req.user._id.toString()
    );
    if (!wasHired) { res.status(403); throw new Error('You were not hired for this job'); }
  }

  // Prevent duplicate open disputes for the same job+pair
  const existing = await Dispute.findOne({
    job:       jobId,
    raisedBy:  req.user._id,
    status:    { $nin: ['resolved','closed'] },
  });
  if (existing) {
    res.status(400);
    throw new Error(`You already have an open dispute (${existing.disputeId}) for this job`);
  }

  const against = await User.findById(againstUserId).select('name role');
  if (!against) { res.status(404); throw new Error('Opposing party not found'); }

  // Auto-set priority based on type
  const urgentTypes = ['payment_not_made','harassment','fraud','unsafe_conditions'];
  const priority = urgentTypes.includes(type) ? 'high' : 'medium';

  // SLA: 3 days for urgent, 7 days for others
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (priority === 'high' ? 3 : 7));

  const dispute = await Dispute.create({
    raisedBy:    req.user._id,
    raisedByRole:req.user.role,
    against:     againstUserId,
    againstRole: against.role,
    job:         jobId,
    type, title, description, amount,
    priority,
    dueDate,
    timeline: [{
      event:     'Dispute raised',
      actor:     req.user.name,
      actorRole: req.user.role,
      note:      `Dispute raised against ${against.name}`,
    }],
  });

  // Notify admin (all admins via a broadcast)
  const admins = await User.find({ role: 'admin' }).select('_id');
  for (const admin of admins) {
    await notifyParty(
      admin._id,
      `🚨 New Dispute: ${dispute.disputeId}`,
      `${req.user.name} raised a "${type.replace(/_/g,' ')}" dispute against ${against.name} for job "${job.title}"`,
      dispute._id, io, 'urgent'
    );
  }

  // Notify the other party
  await notifyParty(
    againstUserId,
    `⚠️ A Dispute Has Been Raised Against You`,
    `${req.user.name} has raised a dispute (${dispute.disputeId}) regarding job "${job.title}". An admin will review shortly.`,
    dispute._id, io, 'urgent'
  );

  successResponse(res, 201, 'Dispute raised successfully', dispute);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/disputes/my — get user's disputes
// ─────────────────────────────────────────────────────────────────────────────
const getMyDisputes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { status } = req.query;

  const filter = {
    $or: [{ raisedBy: req.user._id }, { against: req.user._id }],
  };
  if (status) filter.status = status;

  const [disputes, total] = await Promise.all([
    Dispute.find(filter)
      .populate('raisedBy', 'name avatar role')
      .populate('against', 'name avatar role')
      .populate('job', 'title category status budgetMax')
      .populate('assignedAdmin', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .lean(),
    Dispute.countDocuments(filter),
  ]);

  paginatedResponse(res, disputes, total, page, limit, 'Disputes fetched');
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/disputes/:id — get single dispute with full thread
// ─────────────────────────────────────────────────────────────────────────────
const getDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('raisedBy', 'name avatar role phone email')
    .populate('against', 'name avatar role phone email')
    .populate('job', 'title category status budgetMax budgetMin startDate location')
    .populate('messages.sender', 'name avatar role')
    .populate('assignedAdmin', 'name avatar')
    .populate('resolvedBy', 'name')
    .lean();

  if (!dispute) { res.status(404); throw new Error('Dispute not found'); }

  // Check access — only involved parties + admin
  const userId = req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isRaiser = dispute.raisedBy._id.toString() === userId;
  const isAgainst = dispute.against._id.toString() === userId;

  if (!isAdmin && !isRaiser && !isAgainst) {
    res.status(403); throw new Error('Access denied');
  }

  // Filter admin-only messages for non-admins
  if (!isAdmin) {
    dispute.messages = dispute.messages.filter(m => !m.isAdminOnly);
  }

  successResponse(res, 200, 'Dispute fetched', dispute);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes/:id/messages — add message to dispute thread
// ─────────────────────────────────────────────────────────────────────────────
const addMessage = asyncHandler(async (req, res) => {
  const { content, isAdminOnly = false } = req.body;
  const io = req.app.locals.io;

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) { res.status(404); throw new Error('Dispute not found'); }

  const userId = req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isInvolved = dispute.raisedBy.toString() === userId || dispute.against.toString() === userId;

  if (!isAdmin && !isInvolved) { res.status(403); throw new Error('Access denied'); }
  if (dispute.status === 'resolved' || dispute.status === 'closed') {
    res.status(400); throw new Error('Cannot message on a resolved/closed dispute');
  }

  const msg = {
    sender:     req.user._id,
    senderRole: req.user.role,
    content,
    isAdminOnly: isAdmin && isAdminOnly,
    readBy: [req.user._id],
  };

  dispute.messages.push(msg);
  addTimeline(dispute, 'Message added', req.user.name, req.user.role);

  // Update status
  if (dispute.status === 'open') dispute.status = 'under_review';
  if (dispute.status === 'awaiting_response' && !isAdmin) dispute.status = 'under_review';

  await dispute.save();

  // Notify other parties
  const toNotify = [];
  if (!isAdmin) {
    const admins = await User.find({ role: 'admin' }).select('_id');
    toNotify.push(...admins.map(a => a._id));
  }
  if (isAdmin || dispute.raisedBy.toString() !== userId) {
    if (!dispute.raisedBy.toString() !== userId) toNotify.push(dispute.raisedBy);
  }
  if (dispute.against.toString() !== userId) toNotify.push(dispute.against);

  for (const uid of toNotify) {
    if (io) io.to(`user:${uid}`).emit('dispute:message', {
      disputeId: dispute._id,
      disputeRef: dispute.disputeId,
      sender: req.user.name,
      preview: content.slice(0, 80),
    });
  }

  const populated = await Dispute.findById(dispute._id)
    .populate('messages.sender', 'name avatar role').lean();
  const lastMsg = populated.messages[populated.messages.length - 1];

  successResponse(res, 201, 'Message added', lastMsg);
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/disputes/admin/all — all disputes with filters
// ─────────────────────────────────────────────────────────────────────────────
const getAllDisputesAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { status, priority, type, search, unviewed } = req.query;

  const filter = {};
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;
  if (type)     filter.type     = type;
  if (unviewed === 'true') filter.viewedByAdmin = false;
  if (search) {
    filter.$or = [
      { title:     { $regex: search, $options: 'i' } },
      { disputeId: { $regex: search, $options: 'i' } },
    ];
  }

  const [disputes, total, stats] = await Promise.all([
    Dispute.find(filter)
      .populate('raisedBy', 'name avatar role email')
      .populate('against', 'name avatar role email')
      .populate('job', 'title category status')
      .populate('assignedAdmin', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip).limit(limit)
      .lean(),
    Dispute.countDocuments(filter),
    Dispute.aggregate([
      { $group: {
        _id: null,
        total:        { $sum: 1 },
        open:         { $sum: { $cond: [{ $eq: ['$status', 'open']         }, 1, 0] } },
        under_review: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
        resolved:     { $sum: { $cond: [{ $eq: ['$status', 'resolved']     }, 1, 0] } },
        urgent:       { $sum: { $cond: [{ $eq: ['$priority', 'urgent']     }, 1, 0] } },
        unviewed:     { $sum: { $cond: [{ $eq: ['$viewedByAdmin', false]   }, 1, 0] } },
      }},
    ]),
  ]);

  res.json({
    success: true, data: disputes,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    stats: stats[0] || {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: PUT /api/disputes/:id/review — update status / assign / resolve
// ─────────────────────────────────────────────────────────────────────────────
const reviewDispute = asyncHandler(async (req, res) => {
  const { status, priority, resolution, resolutionNote, adminNotes, dueDate } = req.body;
  const io = req.app.locals.io;

  const dispute = await Dispute.findById(req.params.id)
    .populate('raisedBy', 'name _id')
    .populate('against', 'name _id')
    .populate('job', 'title');

  if (!dispute) { res.status(404); throw new Error('Dispute not found'); }

  const prev = dispute.status;

  if (status)      dispute.status      = status;
  if (priority)    dispute.priority    = priority;
  if (adminNotes !== undefined) dispute.adminNotes = adminNotes;
  if (dueDate)     dispute.dueDate     = new Date(dueDate);
  dispute.assignedAdmin  = req.user._id;
  dispute.viewedByAdmin  = true;

  // Resolve
  if (status === 'resolved' || status === 'closed') {
    dispute.resolution     = resolution;
    dispute.resolutionNote = resolutionNote || '';
    dispute.resolvedBy     = req.user._id;
    dispute.resolvedAt     = new Date();
    addTimeline(dispute, `Dispute ${status}`, req.user.name, 'admin',
      resolution ? `Resolution: ${resolution.replace(/_/g,' ')}` : '');
  } else if (status && status !== prev) {
    addTimeline(dispute, `Status changed to ${status}`, req.user.name, 'admin');
  }

  await dispute.save();

  // Notify both parties when status changes
  if (status && status !== prev) {
    const statusLabels = {
      under_review:       '🔍 Your dispute is under review',
      awaiting_response:  '💬 Admin requires your response',
      resolved:           '✅ Your dispute has been resolved',
      closed:             '📁 Your dispute has been closed',
      escalated:          '⬆️ Your dispute has been escalated',
    };
    const msg = statusLabels[status] || `Dispute status updated to: ${status}`;
    const desc = resolutionNote
      ? `${msg}. ${resolutionNote}`
      : `${msg} — Dispute ${dispute.disputeId} for job "${dispute.job?.title}"`;

    await notifyParty(dispute.raisedBy._id, msg, desc, dispute._id, io);
    await notifyParty(dispute.against._id, msg, desc, dispute._id, io);
  }

  // Audit log
  await auditService.log({
    adminId:    req.user._id,
    adminName:  req.user.name,
    action:     'custom',
    description:`Reviewed dispute ${dispute.disputeId}: status → ${status || 'unchanged'}, resolution: ${resolution || 'pending'}`,
    targetType: 'Dispute' ,
    targetId:   dispute._id,
    targetName: dispute.disputeId,
    metadata:   { status, resolution, priority },
    ipAddress:  req.ip,
  });

  successResponse(res, 200, 'Dispute updated', dispute);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes/:id/mark-viewed — admin marks as viewed
// ─────────────────────────────────────────────────────────────────────────────
const markViewed = asyncHandler(async (req, res) => {
  await Dispute.findByIdAndUpdate(req.params.id, { viewedByAdmin: true });
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes/:id/rate — raiser rates the resolution
// ─────────────────────────────────────────────────────────────────────────────
const rateResolution = asyncHandler(async (req, res) => {
  const { rating, note } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) { res.status(404); throw new Error('Dispute not found'); }
  if (dispute.raisedBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the dispute raiser can rate the resolution');
  }
  if (!['resolved','closed'].includes(dispute.status)) {
    res.status(400); throw new Error('Can only rate resolved/closed disputes');
  }
  dispute.satisfactionRating = rating;
  dispute.satisfactionNote   = note || '';
  await dispute.save();
  successResponse(res, 200, 'Rating submitted', { satisfactionRating: rating });
});

module.exports = {
  raiseDispute, getMyDisputes, getDispute,
  addMessage, getAllDisputesAdmin, reviewDispute,
  markViewed, rateResolution,
};