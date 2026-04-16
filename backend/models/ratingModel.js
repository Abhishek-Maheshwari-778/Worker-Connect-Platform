// const mongoose = require('mongoose');

// const ratingSchema = new mongoose.Schema(
//   {
//     job: {
//       type:     mongoose.Schema.Types.ObjectId,
//       ref:      'Job',
//       required: true,
//     },
//     ratedBy: {
//       type:     mongoose.Schema.Types.ObjectId,
//       ref:      'User',
//       required: true,
//     },
//     ratedUser: {
//       type:     mongoose.Schema.Types.ObjectId,
//       ref:      'User',
//       required: true,
//     },
//     type: {
//       type:    String,
//       enum:    ['client_to_labour', 'labour_to_client'],
//       required: true,
//     },
    

//     // ── Ratings breakdown ─────────────────────────────────────────────────────
//     overallRating:   { type: Number, required: true, min: 1, max: 5 },
//     // For client rating labour:
//     workQuality:     { type: Number, min: 1, max: 5 },
//     punctuality:     { type: Number, min: 1, max: 5 },
//     behaviour:       { type: Number, min: 1, max: 5 },
//     communication:   { type: Number, min: 1, max: 5 },
//     // For labour rating client:
//     paymentReliability: { type: Number, min: 1, max: 5 },
//     workEnvironment:    { type: Number, min: 1, max: 5 },

//     review:   { type: String, maxlength: 1000, trim: true },
//     isPublic: { type: Boolean, default: true },

//     // ── Anti-fraud flags ──────────────────────────────────────────────────────
//     isFlagged:    { type: Boolean, default: false },  // excluded from averages if true
//     flagReason:   { type: String },                   // 'duplicate_rater' | 'suspicious_pattern' | 'self_rating'
//     flaggedAt:    { type: Date },
//     flaggedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   },
//   { timestamps: true }
// );
// ratingSchema.pre('save', function (next) {
//   if (this.ratedBy.toString() === this.ratedUser.toString()) {
//     return next(new Error('Self rating is not allowed'));
//   }
//   next();
// });

// // Prevent duplicate ratings for same job+rater+ratee
// ratingSchema.index({ job: 1, ratedBy: 1, ratedUser: 1 }, { unique: true });
// ratingSchema.index({ ratedUser: 1, type: 1 });

// module.exports = mongoose.model('Rating', ratingSchema);

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ratedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  review: String,

  // Labour ratings
  workQuality: Number,
  punctuality: Number,
  behaviour: Number,
  communication: Number,

  // Client ratings
  paymentReliability: Number,
  workEnvironment: Number,

}, { timestamps: true });

/* ❗ Prevent self rating */
ratingSchema.pre('save', function (next) {
  if (this.ratedBy.toString() === this.ratedUser.toString()) {
    return next(new Error('Self rating is not allowed'));
  }
  next();
});

/* ✅ CommonJS export */
module.exports = mongoose.model('Rating', ratingSchema);