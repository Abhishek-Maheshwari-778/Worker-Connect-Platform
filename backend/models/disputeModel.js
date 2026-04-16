/**
 * Dispute Model — Labour Connect
 * Manages conflict resolution between clients and labour workers.
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole:{ type: String, enum: ['labour','client','admin'], required: true },
  content:   { type: String, required: true, maxlength: 2000 },
  attachments:[{ url: String, publicId: String, name: String }],
  isAdminOnly:{ type: Boolean, default: false }, // internal notes only admins see
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const timelineSchema = new mongoose.Schema({
  event:     { type: String, required: true },
  actor:     { type: String },                // who triggered
  actorRole: { type: String },
  note:      { type: String },
}, { timestamps: true, _id: true });

const disputeSchema = new mongoose.Schema({
  // ── Reference ────────────────────────────────────────────────────────────
  disputeId: { type: String, unique: true }, // LC-DISP-001 format, auto-generated

  // ── Parties ───────────────────────────────────────────────────────────────
  raisedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  raisedByRole: { type: String, enum: ['labour','client'], required: true },
  against:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  againstRole:  { type: String, enum: ['labour','client'], required: true },

  // ── Job reference ─────────────────────────────────────────────────────────
  job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

  // ── Dispute details ───────────────────────────────────────────────────────
  type: {
    type: String,
    required: true,
    enum: ['payment_not_made','work_not_done','work_quality','harassment','fraud',
           'contract_breach','unsafe_conditions','other'],
  },
  title:       { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  amount:      { type: Number }, // disputed amount in INR if payment-related

  // ── Evidence ──────────────────────────────────────────────────────────────
  attachments: [{ url: String, publicId: String, name: String, type: String }],

  // ── Status flow ───────────────────────────────────────────────────────────
  // open → under_review → awaiting_response → resolved / closed / escalated
  status: {
    type: String,
    enum: ['open','under_review','awaiting_response','resolved','closed','escalated'],
    default: 'open',
    index: true,
  },

  priority: {
    type: String,
    enum: ['low','medium','high','urgent'],
    default: 'medium',
  },

  // ── Resolution ────────────────────────────────────────────────────────────
  resolution: {
    type:   String,
    enum:   ['favour_client','favour_labour','mutual_agreement','no_action','escalated_external'],
  },
  resolutionNote: { type: String, maxlength: 2000 },
  resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:    { type: Date },

  // ── Admin handling ────────────────────────────────────────────────────────
  assignedAdmin:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNotes:     { type: String, maxlength: 3000 }, // private admin notes
  dueDate:        { type: Date }, // SLA deadline

  // ── Messaging thread ──────────────────────────────────────────────────────
  messages: [messageSchema],

  // ── Timeline / audit trail ────────────────────────────────────────────────
  timeline: [timelineSchema],

  // ── Ratings after resolution ──────────────────────────────────────────────
  satisfactionRating: { type: Number, min: 1, max: 5 },
  satisfactionNote:   { type: String },

  // ── Flags ─────────────────────────────────────────────────────────────────
  isEscalated: { type: Boolean, default: false },
  isFlagged:   { type: Boolean, default: false }, // flagged as urgent by admin
  viewedByAdmin:{ type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject:{ virtuals: true },
});

// ── Auto-generate disputeId ───────────────────────────────────────────────────
disputeSchema.pre('save', async function (next) {
  if (!this.disputeId) {
    const count = await mongoose.model('Dispute').countDocuments();
    this.disputeId = `LC-DISP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
disputeSchema.index({ raisedBy: 1, status: 1 });
disputeSchema.index({ against: 1, status: 1 });
disputeSchema.index({ job: 1 });
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ priority: 1, status: 1 });
disputeSchema.index({ assignedAdmin: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);