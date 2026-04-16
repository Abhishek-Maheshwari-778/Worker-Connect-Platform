/**
 * Notification Service
 * Central place to create and emit notifications.
 * Used by all controllers (job, user, rating, admin).
 */
const Notification = require('../models/notificationModel');

let _io = null; // Socket.IO instance injected at startup

/** Call once from server.js after initSocket() */
const setIO = (io) => { _io = io; };

/**
 * Create a notification and push it to the recipient in real-time.
 * @param {object} data - Notification fields
 * @returns {Promise<Notification>}
 */
const createAndEmit = async (data) => {
  try {
    const notification = await Notification.create(data);

    // Emit to recipient's personal room if online
    if (_io) {
      _io.to(`user:${data.userId}`).emit('notification:new', notification.toObject());
    }

    return notification;
  } catch (err) {
    console.error('❌ Notification create error:', err.message);
    return null;
  }
};

/** Convenience helpers for specific events ─────────────────────────────────── */

const notifyJobApplied = async (io, { job, labour, client }) => {
  setIO(io);
  return createAndEmit({
    userId:           client._id,
    senderId:         labour._id,
    senderName:       labour.name,
    senderProfileUrl: labour.avatar?.url || '',
    senderRole:       'labour',
    type:             'job_applied',
    category:         'job',
    priority:         'high',
    title:            'New Job Application',
    description:      `${labour.name} applied for your job "${job.title}"`,
    refModel:         'Job',
    refId:            job._id,
    actionRequired:   true,
    actions: [
      { label: 'View', type: 'view' },
    ],
  });
};

const notifyJobStatusUpdate = async (io, { job, labour, status }) => {
  setIO(io);
  const statusMessages = {
    accepted:    { title: '🎉 Application Accepted!', desc: `You have been accepted for "${job.title}". Get ready to start!`, priority: 'urgent' },
    rejected:    { title: 'Application Update',       desc: `Your application for "${job.title}" was not selected this time.`, priority: 'normal' },
    shortlisted: { title: '⭐ You Are Shortlisted!',  desc: `You have been shortlisted for "${job.title}". Client will confirm soon.`, priority: 'high' },
    completed:   { title: 'Job Completed',             desc: `"${job.title}" has been marked as completed. Please rate the client.`, priority: 'normal' },
  };
  const meta = statusMessages[status] || { title: 'Job Update', desc: `Status update for "${job.title}"`, priority: 'normal' };

  return createAndEmit({
    userId:           labour._id,
    senderName:       'Labour Connect',
    senderRole:       'system',
    type:             `job_${status}`,
    category:         'job',
    priority:         meta.priority,
    title:            meta.title,
    description:      meta.desc,
    refModel:         'Job',
    refId:            job._id,
  });
};

const notifyNewJob = async (io, { job, labourIds }) => {
  setIO(io);
  const notifications = labourIds.map(uid => ({
    userId:         uid,
    senderName:     'Labour Connect',
    senderRole:     'system',
    type:           'job_new',
    category:       'job',
    priority:       job.isUrgent ? 'urgent' : 'normal',
    title:          job.isUrgent ? '⚡ Urgent Job Near You!' : 'New Job Matching Your Skills',
    description:    `"${job.title}" — ₹${job.budgetMin}–₹${job.budgetMax}/day in ${job.location?.city || 'your area'}`,
    refModel:       'Job',
    refId:          job._id,
  }));
  const created = await Notification.insertMany(notifications);
  if (_io) {
    created.forEach(n => _io.to(`user:${n.userId}`).emit('notification:new', n.toObject()));
  }
  return created;
};

const notifyNewScheme = async (io, { scheme, labourIds }) => {
  setIO(io);
  const notifications = labourIds.map(uid => ({
    userId:      uid,
    senderName:  'Govt. Schemes',
    senderRole:  'system',
    type:        'scheme_new',
    category:    'scheme',
    priority:    'normal',
    title:       '📋 New Government Scheme Available',
    description: `${scheme.title} — ${scheme.description?.slice(0, 80)}…`,
    refModel:    null,
    refId:       null,
  }));
  const created = await Notification.insertMany(notifications);
  if (_io) {
    created.forEach(n => _io.to(`user:${n.userId}`).emit('notification:new', n.toObject()));
  }
  return created;
};

const notifyVerificationUpdate = async (io, { userId, status, note }) => {
  setIO(io);
  const meta = {
    approved: { title: '✅ Identity Verified!',     desc: 'Your Aadhaar has been verified. You now have the Verified badge!', priority: 'urgent' },
    rejected: { title: 'Verification Not Approved', desc: note ? `Reason: ${note}` : 'Your document was not approved. Please re-upload a clearer photo.', priority: 'high' },
    pending:  { title: 'Document Under Review',     desc: 'Your Aadhaar is being reviewed by our team. Usually takes 24 hours.', priority: 'normal' },
  };
  const m = meta[status] || meta.pending;
  return createAndEmit({
    userId,
    senderName: 'Labour Connect Admin',
    senderRole: 'admin',
    type:       `verification_${status}`,
    category:   'verification',
    priority:   m.priority,
    title:      m.title,
    description:m.desc,
  });
};

const notifyNewUserToAdmin = async (io, { adminIds, newUser }) => {
  setIO(io);
  const notifications = adminIds.map(uid => ({
    userId:           uid,
    senderId:         newUser._id,
    senderName:       newUser.name,
    senderProfileUrl: newUser.avatar?.url || '',
    senderRole:       newUser.role,
    type:             'user_registered',
    category:         'alert',
    priority:         'normal',
    title:            `New ${newUser.role === 'labour' ? 'Worker' : 'Client'} Registered`,
    description:      `${newUser.name} joined Labour Connect as a ${newUser.role}.`,
    refModel:         'User',
    refId:            newUser._id,
  }));
  const created = await Notification.insertMany(notifications);
  if (_io) {
    created.forEach(n => _io.to(`user:${n.userId}`).emit('notification:new', n.toObject()));
  }
  return created;
};

const notifyRatingReceived = async (io, { userId, ratedBy, rating, jobTitle }) => {
  setIO(io);
  return createAndEmit({
    userId,
    senderId:         ratedBy._id,
    senderName:       ratedBy.name,
    senderProfileUrl: ratedBy.avatar?.url || '',
    senderRole:       ratedBy.role,
    type:             'rating_received',
    category:         'rating',
    priority:         'normal',
    title:            `⭐ New Rating — ${rating}/5`,
    description:      `${ratedBy.name} rated you ${rating} stars for "${jobTitle}"`,
    refModel:         'User',
    refId:            userId,
  });
};

module.exports = {
  setIO,
  createAndEmit,
  notifyJobApplied,
  notifyJobStatusUpdate,
  notifyNewJob,
  notifyNewScheme,
  notifyVerificationUpdate,
  notifyNewUserToAdmin,
  notifyRatingReceived,
};