// // const mongoose = require('mongoose');

// // // ─── Sub-schema: Labour requirement per skill ──────────────────────────────────
// // const labourRequirementSchema = new mongoose.Schema(
// //   {
// //     skill:       { type: String, required: true, trim: true },
// //     count:       { type: Number, required: true, min: 1 },
// //     minExp:      { type: Number, default: 0 },
// //     filledCount: { type: Number, default: 0 },
// //   },
// //   { _id: false }
// // );

// // // ─── Sub-schema: Location ──────────────────────────────────────────────────────
// // const jobLocationSchema = new mongoose.Schema(
// //   {
// //     type:        { type: String, enum: ['Point'], default: 'Point' },
// //     coordinates: { type: [Number], required: true }, // [lng, lat]
// //     address:     { type: String, required: true, trim: true },
// //     city:        { type: String, trim: true },
// //     state:       { type: String, trim: true },
// //     pincode:     { type: String, trim: true },
// //   },
// //   { _id: false }
// // );

// // // ─── Main Job Schema ───────────────────────────────────────────────────────────
// // const jobSchema = new mongoose.Schema(
// //   {
// //     // ── Core fields ───────────────────────────────────────────────────────────
// //     title: {
// //       type:     String,
// //       required: [true, 'Job title is required'],
// //       trim:     true,
// //       maxlength: [100, 'Title cannot exceed 100 characters'],
// //     },
// //     description: {
// //       type:     String,
// //       required: [true, 'Job description is required'],
// //       trim:     true,
// //       maxlength: [2000, 'Description cannot exceed 2000 characters'],
// //     },
// //     category: {
// //       type:     String,
// //       required: [true, 'Category is required'],
// //       trim:     true,
// //       enum: [
// //         'construction', 'electrical', 'plumbing', 'painting',
// //         'carpentry', 'welding', 'cleaning', 'gardening',
// //         'moving', 'security', 'driving', 'cooking', 'other',
// //       ],
// //     },

// //     // ── Who posted it ─────────────────────────────────────────────────────────
// //     postedBy: {
// //       type:     mongoose.Schema.Types.ObjectId,
// //       ref:      'User',
// //       required: true,
// //     },

// //     // ── Labour requirements ───────────────────────────────────────────────────
// //     requirements:    [labourRequirementSchema],
// //     totalLabourNeeded: { type: Number, required: true, min: 1 },

// //     // ── Budget ───────────────────────────────────────────────────────────────
// //     budgetType:   { type: String, enum: ['fixed', 'daily', 'hourly'], default: 'daily' },
// //     budgetMin:    { type: Number, required: true, min: 0 },
// //     budgetMax:    { type: Number, required: true, min: 0 },
// //     currency:     { type: String, default: 'INR' },

// //     // ── Dates ─────────────────────────────────────────────────────────────────
// //     startDate:    { type: Date, required: true },
// //     endDate:      { type: Date },
// //     duration:     { type: String, trim: true }, // e.g. "3 days", "1 week"

// //     // ── Location ──────────────────────────────────────────────────────────────
// //     location: jobLocationSchema,

// //     // ── Status ───────────────────────────────────────────────────────────────
// //     status: {
// //       type:    String,
// //       enum:    ['open', 'in_progress', 'completed', 'cancelled', 'on_hold'],
// //       default: 'open',
// //     },
// //     isUrgent:  { type: Boolean, default: false },
// //     isGroupJob:{ type: Boolean, default: false },

// //     // ── Applications ─────────────────────────────────────────────────────────
// //     applicants: [
// //       {
// //         labour:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// //         status:       { type: String, enum: ['applied', 'shortlisted', 'accepted', 'rejected', 'withdrawn'], default: 'applied' },
// //         proposalMsg:  { type: String, maxlength: 500 },
// //         proposedWage: { type: Number },
// //         appliedAt:    { type: Date, default: Date.now },
// //       },
// //     ],

// //     // ── Accepted labourers ────────────────────────────────────────────────────
// //     hiredLabourers: [
// //       {
// //         labour:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// //         hiredAt:   { type: Date, default: Date.now },
// //         agreedWage:{ type: Number },
// //       },
// //     ],

// //     // ── Ratings ───────────────────────────────────────────────────────────────
// //     labourRatings: [
// //       {
// //         labour:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// //         rating:    { type: Number, min: 1, max: 5 },
// //         review:    { type: String, maxlength: 500 },
// //         ratedAt:   { type: Date, default: Date.now },
// //       },
// //     ],
// //     clientRatedByLabour: {
// //       rating:   { type: Number, min: 1, max: 5 },
// //       review:   { type: String, maxlength: 500 },
// //       ratedAt:  { type: Date },
// //     },

// //     // ── Fraud Detection ──────────────────────────────────────────────────────
// //     fraudFlags: [{
// //       type:        { type: String }, // 'duplicate_title','high_wage','never_completed','ghost_job','rapid_posting','no_hire'
// //       severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
// //       description: { type: String },
// //       detectedAt:  { type: Date, default: Date.now },
// //       autoDetected:{ type: Boolean, default: true },
// //     }],
// //     fraudScore:     { type: Number, default: 0, min: 0, max: 100 }, // 0=clean, 100=definite fraud
// //     isFraudFlagged: { type: Boolean, default: false, index: true },
// //     fraudReviewedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// //     fraudReviewedAt:{ type: Date },
// //     fraudAction:    { type: String, enum: ['none','warned','removed','cleared'], default: 'none' },
// //     fraudNote:      { type: String },

// //     // ── Misc ──────────────────────────────────────────────────────────────────
// //     views:   { type: Number, default: 0 },
// //     images:  [{ url: String, publicId: String }],
// //     tags:    [{ type: String, trim: true, lowercase: true }],
// //   },
// //   {
// //     timestamps: true,
// //     toJSON:    { virtuals: true },
// //     toObject:  { virtuals: true },
// //   }
// // );

// // // ─── Indexes ───────────────────────────────────────────────────────────────────
// // jobSchema.index({ 'location.coordinates': '2dsphere' });
// // jobSchema.index({ status: 1, category: 1 });
// // jobSchema.index({ postedBy: 1 });
// // jobSchema.index({ startDate: 1 });
// // jobSchema.index({ tags: 1 });
// // jobSchema.index({ createdAt: -1 });

// // // ─── Virtuals ─────────────────────────────────────────────────────────────────
// // jobSchema.virtual('applicantCount').get(function () {
// //   return this.applicants?.length ?? 0;
// // });

// // jobSchema.virtual('isOpen').get(function () {
// //   return this.status === 'open';
// // });

// // module.exports = mongoose.model('Job', jobSchema);

// const mongoose = require('mongoose');

// // ─── Sub-schema: Labour requirement per skill ──────────────────────────────────
// const labourRequirementSchema = new mongoose.Schema(
//   {
//     skill:       { type: String, required: true, trim: true },
//     count:       { type: Number, required: true, min: 1 },
//     minExp:      { type: Number, default: 0 },
//     filledCount: { type: Number, default: 0 },
//   },
//   { _id: false }
// );

// // ─── Sub-schema: Location ──────────────────────────────────────────────────────
// const jobLocationSchema = new mongoose.Schema(
//   {
//     type:        { type: String, enum: ['Point'], default: 'Point' },
//     coordinates: { type: [Number], required: true }, // [lng, lat]
//     address:     { type: String, required: true, trim: true },
//     city:        { type: String, trim: true },
//     state:       { type: String, trim: true },
//     pincode:     { type: String, trim: true },
//   },
//   { _id: false }
// );

// // ─── Main Job Schema ───────────────────────────────────────────────────────────
// const jobSchema = new mongoose.Schema(
//   {
//     // ── Core fields ───────────────────────────────────────────────────────────
//     title: {
//       type:     String,
//       required: [true, 'Job title is required'],
//       trim:     true,
//       maxlength: [100, 'Title cannot exceed 100 characters'],
//     },
//     description: {
//       type:     String,
//       required: [true, 'Job description is required'],
//       trim:     true,
//       maxlength: [2000, 'Description cannot exceed 2000 characters'],
//     },
//     category: {
//       type:     String,
//       required: [true, 'Category is required'],
//       trim:     true,
//       enum: [
//         'construction', 'electrical', 'plumbing', 'painting',
//         'carpentry', 'welding', 'cleaning', 'gardening',
//         'moving', 'security', 'driving', 'cooking', 'other',
//       ],
//     },

//     // ── Who posted it ─────────────────────────────────────────────────────────
//     postedBy: {
//       type:     mongoose.Schema.Types.ObjectId,
//       ref:      'User',
//       required: true,
//     },

//     // ── Labour requirements ───────────────────────────────────────────────────
//     requirements:    [labourRequirementSchema],
//     totalLabourNeeded: { type: Number, required: true, min: 1 },

//     // ── Budget ───────────────────────────────────────────────────────────────
//     budgetType:   { type: String, enum: ['fixed', 'daily', 'hourly'], default: 'daily' },
//     budgetMin:    { type: Number, required: true, min: 0 },
//     budgetMax:    { type: Number, required: true, min: 0 },
//     currency:     { type: String, default: 'INR' },

//     // ── Dates ─────────────────────────────────────────────────────────────────
//     startDate:    { type: Date, required: true },
//     endDate:      { type: Date },
//     duration:     { type: String, trim: true }, // e.g. "3 days", "1 week"

//     // ── Expiry Management ─────────────────────────────────────────────────────
//     expiresAt: { 
//       type: Date, 
//       index: true,
//       description: 'Auto-expiry date for the job posting'
//     },
//     isExpired: { 
//       type: Boolean, 
//       default: false, 
//       index: true 
//     },
//     expiryNotified: {
//       type: Boolean,
//       default: false,
//       description: 'Whether 1-day warning notification was sent'
//     },
//     expiredAt: {
//       type: Date,
//       description: 'When the job was actually marked as expired'
//     },

//     // ── Location ──────────────────────────────────────────────────────────────
//     location: jobLocationSchema,

//     // ── Status ───────────────────────────────────────────────────────────────
//     status: {
//       type:    String,
//       enum:    ['open', 'in_progress', 'completed', 'cancelled', 'on_hold', 'expired'],
//       default: 'open',
//     },
//     isUrgent:  { type: Boolean, default: false },
//     isGroupJob:{ type: Boolean, default: false },

//     // ── Saved Jobs ────────────────────────────────────────────────────────────
//     savedBy: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       index: true
//     }],

//     // ── Applications ─────────────────────────────────────────────────────────
//     applicants: [
//       {
//         labour:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         status:       { type: String, enum: ['applied', 'shortlisted', 'accepted', 'rejected', 'withdrawn'], default: 'applied' },
//         proposalMsg:  { type: String, maxlength: 500 },
//         proposedWage: { type: Number },
//         appliedAt:    { type: Date, default: Date.now },
//       },
//     ],

//     // ── Accepted labourers ────────────────────────────────────────────────────
//     hiredLabourers: [
//       {
//         labour:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         hiredAt:   { type: Date, default: Date.now },
//         agreedWage:{ type: Number },
//       },
//     ],

//     // ── Ratings ───────────────────────────────────────────────────────────────
//     labourRatings: [
//       {
//         labour:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         rating:    { type: Number, min: 1, max: 5 },
//         review:    { type: String, maxlength: 500 },
//         ratedAt:   { type: Date, default: Date.now },
//       },
//     ],
//     clientRatedByLabour: {
//       rating:   { type: Number, min: 1, max: 5 },
//       review:   { type: String, maxlength: 500 },
//       ratedAt:  { type: Date },
//     },

//     // ── Fraud Detection ──────────────────────────────────────────────────────
//     fraudFlags: [{
//       type:        { type: String }, // 'duplicate_title','high_wage','never_completed','ghost_job','rapid_posting','no_hire'
//       severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
//       description: { type: String },
//       detectedAt:  { type: Date, default: Date.now },
//       autoDetected:{ type: Boolean, default: true },
//     }],
//     fraudScore:     { type: Number, default: 0, min: 0, max: 100 }, // 0=clean, 100=definite fraud
//     isFraudFlagged: { type: Boolean, default: false, index: true },
//     fraudReviewedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     fraudReviewedAt:{ type: Date },
//     fraudAction:    { type: String, enum: ['none','warned','removed','cleared'], default: 'none' },
//     fraudNote:      { type: String },

//     // ── Misc ──────────────────────────────────────────────────────────────────
//     views:   { type: Number, default: 0 },
//     images:  [{ url: String, publicId: String }],
//     tags:    [{ type: String, trim: true, lowercase: true }],
//   },
//   {
//     timestamps: true,
//     toJSON:    { virtuals: true },
//     toObject:  { virtuals: true },
//   }
// );

// // ─── Indexes ───────────────────────────────────────────────────────────────────
// jobSchema.index({ 'location.coordinates': '2dsphere' });
// jobSchema.index({ status: 1, category: 1 });
// jobSchema.index({ postedBy: 1 });
// jobSchema.index({ startDate: 1 });
// jobSchema.index({ tags: 1 });
// jobSchema.index({ createdAt: -1 });
// jobSchema.index({ expiresAt: 1, isExpired: 1 }); // For expiry cron job
// jobSchema.index({ 'savedBy': 1 }); // For saved jobs queries

// // ─── Virtuals ─────────────────────────────────────────────────────────────────
// jobSchema.virtual('applicantCount').get(function () {
//   return this.applicants?.length ?? 0;
// });

// jobSchema.virtual('isOpen').get(function () {
//   return this.status === 'open' && !this.isExpired;
// });

// // ─── Pre-save hook to auto-set expiresAt if not provided ────────────────────────
// jobSchema.pre('save', function(next) {
//   if (this.isNew && !this.expiresAt) {
//     // Default expiry: endDate + 1 day, or startDate + 30 days, or createdAt + 30 days
//     if (this.endDate) {
//       this.expiresAt = new Date(this.endDate.getTime() + 24 * 60 * 60 * 1000);
//     } else if (this.startDate) {
//       this.expiresAt = new Date(this.startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
//     } else {
//       this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model('Job', jobSchema);

const mongoose = require('mongoose');

const labourRequirementSchema = new mongoose.Schema(
  {
    skill:       { type: String, required: true, trim: true },
    count:       { type: Number, required: true, min: 1 },
    minExp:      { type: Number, default: 0 },
    filledCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const jobLocationSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address:     { type: String, required: true, trim: true },
    city:        { type: String, trim: true },
    state:       { type: String, trim: true },
    pincode:     { type: String, trim: true },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Job title is required'],
      trim:     true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type:     String,
      required: [true, 'Job description is required'],
      trim:     true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      trim:     true,
      enum: [
        'construction', 'electrical', 'plumbing', 'painting',
        'carpentry', 'welding', 'cleaning', 'gardening',
        'moving', 'security', 'driving', 'cooking', 'other',
      ],
    },
    postedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    requirements:    [labourRequirementSchema],
    totalLabourNeeded: { type: Number, required: true, min: 1 },
    budgetType:   { type: String, enum: ['fixed', 'daily', 'hourly'], default: 'daily' },
    budgetMin:    { type: Number, required: true, min: 0 },
    budgetMax:    { type: Number, required: true, min: 0 },
    currency:     { type: String, default: 'INR' },
    startDate:    { type: Date, required: true },
    endDate:      { type: Date },
    duration:     { type: String, trim: true },
    
    // Expiry Management
    expiresAt: { 
  type: Date, 
  required: true,
},
    isExpired: { 
      type: Boolean, 
      default: false, 
      index: true 
    },
    expiryNotified: {
      type: Boolean,
      default: false,
    },
    expiredAt: {
      type: Date,
    },

    location: jobLocationSchema,

    status: {
      type:    String,
      enum:    ['open', 'in_progress', 'completed', 'cancelled', 'on_hold', 'expired'],
      default: 'open',
    },
    isUrgent:  { type: Boolean, default: false },
    isGroupJob:{ type: Boolean, default: false },

    savedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }],

    applicants: [
      {
        labour:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status:       { type: String, enum: ['applied', 'shortlisted', 'accepted', 'rejected', 'withdrawn'], default: 'applied' },
        proposalMsg:  { type: String, maxlength: 500 },
        proposedWage: { type: Number },
        appliedAt:    { type: Date, default: Date.now },
      },
    ],

    hiredLabourers: [
      {
        labour:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        hiredAt:   { type: Date, default: Date.now },
        agreedWage:{ type: Number },
      },
    ],

    labourRatings: [
      {
        labour:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating:    { type: Number, min: 1, max: 5 },
        review:    { type: String, maxlength: 500 },
        ratedAt:   { type: Date, default: Date.now },
      },
    ],
    clientRatedByLabour: {
      rating:   { type: Number, min: 1, max: 5 },
      review:   { type: String, maxlength: 500 },
      ratedAt:  { type: Date },
    },

    fraudFlags: [{
      type:        { type: String },
      severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
      description: { type: String },
      detectedAt:  { type: Date, default: Date.now },
      autoDetected:{ type: Boolean, default: true },
    }],
    fraudScore:     { type: Number, default: 0, min: 0, max: 100 },
    isFraudFlagged: { type: Boolean, default: false, index: true },
    fraudReviewedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fraudReviewedAt:{ type: Date },
    fraudAction:    { type: String, enum: ['none','warned','removed','cleared'], default: 'none' },
    fraudNote:      { type: String },

    views:   { type: Number, default: 0 },
    images:  [{ url: String, publicId: String }],
    tags:    [{ type: String, trim: true, lowercase: true }],
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

// Indexes
jobSchema.index({ 'location.coordinates': '2dsphere' });
jobSchema.index({ status: 1, category: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ startDate: 1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ expiresAt: 1, isExpired: 1 });
jobSchema.index({ savedBy: 1 });

// Virtuals
jobSchema.virtual('applicantCount').get(function () {
  return this.applicants?.length ?? 0;
});

jobSchema.virtual('isOpen').get(function () {
  return this.status === 'open' && !this.isExpired;
});

jobSchema.virtual('computedExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Pre-save hook
jobSchema.pre('save', function(next) {
  // Always ensure expiresAt exists
  if (!this.expiresAt) {
    if (this.endDate) {
      this.expiresAt = new Date(this.endDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (this.startDate) {
      this.expiresAt = new Date(this.startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Auto mark expired (safety fallback if cron misses)
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.isExpired = true;
    this.status = 'expired';
  }

  next();
});

module.exports = mongoose.model('Job', jobSchema);