const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema({
  url:        { type: String },
  publicId:   { type: String },
  status:     { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  reviewNote: { type: String },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const portfolioImageSchema = new mongoose.Schema({
  url:        { type: String, required: true },
  publicId:   { type: String, required: true },
  caption:    { type: String, trim: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const badgeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['verified','top_rated','fast_responder','reliable_worker',
           'highly_experienced','rising_star','premium_labour'],
  },
  awardedAt: { type: Date, default: Date.now },
}, { _id: false });

const skillSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  yearsOfExp:  { type: Number, default: 0 },
  proficiency: { type: String, enum: ['beginner','intermediate','expert'], default: 'intermediate' },
}, { _id: false });

/**
 * Achievement timeline — records when key milestones were reached.
 * Used to display "Earned Top Rated on 12 Jan 2025" in the profile.
 */
const achievementSchema = new mongoose.Schema({
  type:        { type: String, required: true },  // badge type or milestone key
  label:       { type: String, required: true },  // human-readable label
  description: { type: String },
  earnedAt:    { type: Date, default: Date.now },
  icon:        { type: String, default: 'award' },// lucide icon name
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────
const labourProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true, unique: true,
  },

  // ── Professional ──────────────────────────────────────────────────────────
  bio:                 { type: String, maxlength: 1000, trim: true, default: '' },
  experience:          { type: Number, default: 0, min: 0 },
  dailyWageMin:        { type: Number, default: 0, min: 0 },
  dailyWageMax:        { type: Number, default: 0, min: 0 },
  workingHours:        { type: Number, default: 8 },
  preferredShift:      { type: String, enum: ['morning','evening','night','flexible'], default: 'flexible' },
  workingRadius:       { type: Number, default: 20, min: 1, max: 500 },
  availableFrom:       { type: Date },
  isAvailable:         { type: Boolean, default: true },
  skills:              [skillSchema],
  preferredCategories: [{ type: String, trim: true }],
  languages:           [{ type: String, trim: true }],

  // ── Verification ──────────────────────────────────────────────────────────
  aadhaarDoc:           documentSchema,
  aadhaarNumber:        { type: String, select: false },
  verificationStatus: {
    type: String,
    enum: ['not_submitted','pending','approved','rejected'],
    default: 'not_submitted',
  },

  // ── Portfolio ──────────────────────────────────────────────────────────────
  portfolioImages: [portfolioImageSchema],

  // ── Reputation (core metrics) ──────────────────────────────────────────────
  averageRating:     { type: Number, default: 0, min: 0, max: 5 },
  totalRatings:      { type: Number, default: 0 },
  // Anti-fraud: separate counts of valid vs flagged ratings
  validRatings:      { type: Number, default: 0 },
  flaggedRatings:    { type: Number, default: 0 },

  completedJobs:     { type: Number, default: 0 },
  totalAcceptedJobs: { type: Number, default: 0 }, // accepted jobs (denominator for completionRate)
  totalApplications: { type: Number, default: 0 },
  completionRate:    { type: Number, default: 0, min: 0, max: 100 },
  responseRate:      { type: Number, default: 0 },
  responseTimeAvg:   { type: Number, default: 999 }, // minutes, lower = better

  // ── Gamification ──────────────────────────────────────────────────────────
  score:       { type: Number, default: 0 },
  level:       { type: Number, default: 1, min: 1, max: 10 },
  points:      { type: Number, default: 0 },
  trustScore:  { type: Number, default: 0, min: 0, max: 100 },

  // ── Badges ────────────────────────────────────────────────────────────────
  badges:             [badgeSchema],
  achievementTimeline:[achievementSchema], // full history of milestones

  // ── Weekly / monthly tracking ──────────────────────────────────────────────
  weeklyJobsCompleted:  { type: Number, default: 0 },
  monthlyJobsCompleted: { type: Number, default: 0 },
  weeklyReset:          { type: Date, default: Date.now },
  monthlyReset:         { type: Date, default: Date.now },
  lastActiveAt:         { type: Date, default: Date.now },
},
{
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject:{ virtuals: true },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
labourProfileSchema.index({ 'skills.name': 1 });
labourProfileSchema.index({ verificationStatus: 1 });
labourProfileSchema.index({ averageRating: -1 });
labourProfileSchema.index({ isAvailable: 1 });
labourProfileSchema.index({ score: -1 });
labourProfileSchema.index({ level: -1, score: -1 });
labourProfileSchema.index({ weeklyJobsCompleted: -1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
labourProfileSchema.virtual('wageRange').get(function () {
  if (!this.dailyWageMin && !this.dailyWageMax) return 'Not set';
  return `₹${this.dailyWageMin} – ₹${this.dailyWageMax}/day`;
});

module.exports = mongoose.model('LabourProfile', labourProfileSchema);