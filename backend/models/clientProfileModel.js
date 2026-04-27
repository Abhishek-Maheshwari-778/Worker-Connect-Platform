const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },

    // ── Business Info ─────────────────────────────────────────────────────────
    companyName:  { type: String, trim: true, default: '' },
    companyType:  {
      type:    String,
      enum:    ['individual', 'small_business', 'contractor', 'enterprise'],
      default: 'individual',
    },
    industryType: { type: String, trim: true, default: '' },
    gstNumber:    { type: String, trim: true, default: '' },
    websiteUrl:   { type: String, trim: true, default: '' },
    bio:          { type: String, trim: true, maxlength: 500, default: '' },

    // ── Reputation ────────────────────────────────────────────────────────────
    averageRating:      { type: Number, default: 0, min: 0, max: 5 },
    totalRatings:       { type: Number, default: 0 },
    paymentReliability: { type: Number, default: 0, min: 0, max: 5 },
    totalJobsPosted:    { type: Number, default: 0 },
    totalHires:         { type: Number, default: 0 },

    // ── Identity Verification ────────────────────────────────────────────────
    aadhaarDoc: {
      url:        { type: String, default: null },
      publicId:   { type: String, default: null },
      status:     { type: String, enum: ['pending', 'approved', 'rejected', null] },
      reviewNote: { type: String },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    verificationStatus: {
      type:    String,
      enum:    ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    isVerified: { type: Boolean, default: false },

    // ── Payment ───────────────────────────────────────────────────────────────
    preferredPaymentMode: {
      type:    String,
      enum:    ['cash', 'upi', 'bank_transfer', 'cheque'],
      default: 'upi',
    },
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

clientProfileSchema.index({ averageRating: -1 });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);