const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');

// ─── Sub-schema: Location ──────────────────────────────────────────────────────
const locationSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address:     { type: String, trim: true },
    city:        { type: String, trim: true },
    state:       { type: String, trim: true },
    pincode:     { type: String, trim: true },
  },
  { _id: false }
);

// ─── Main User Schema ──────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type:     String,
      trim:     true,
      default:  '',
      validate: {
        validator: function(v) {
          if (!v || v === '') return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Please enter a valid 10-digit Indian mobile number',
      },
    },

    // ── Emergency Contact ─────────────────────────────────────────────────────
    emergencyContact: {
      name:         { type: String, trim: true, default: '' },
      phone:        {
        type:     String,
        trim:     true,
        default:  '',
        validate: {
          validator: function(v) {
            if (!v || v === '') return true;
            return /^[6-9]\d{9}$/.test(v);
          },
          message: 'Emergency contact must be a valid 10-digit Indian mobile number',
        },
      },
      relation:     { type: String, trim: true, default: '' }, // Father, Mother, Spouse etc.
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,
    },

    // ── Role & Status ─────────────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ['labour', 'client', 'admin', 'employee'],
      default: 'labour',
    },
    isActive:          { type: Boolean, default: true },
    isSuspended:       { type: Boolean, default: false },
    suspendedAt:       { type: Date },
    suspendedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    suspendReason:     { type: String, trim: true, default: '' },
    suspensionHistory: [{
      action:     { type: String, enum: ['suspended','unsuspended'] },
      reason:     { type: String },
      actionBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      actionAt:   { type: Date, default: Date.now },
    }],
    isVerified:        { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },

    // ── Avatar ────────────────────────────────────────────────────────────────
    avatar: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    // ── Personal Details ──────────────────────────────────────────────────────
    dob: {
      type: Date,
      default: null,
    },
    gender: {
      type:    String,
      enum:    ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: '',
    },

    // ── Location ──────────────────────────────────────────────────────────────
    location: locationSchema,

    // ── Labour-specific fields ─────────────────────────────────────────────────
    labourProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'LabourProfile',
    },

    // ── Client-specific fields ─────────────────────────────────────────────────
    clientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'ClientProfile',
    },

    // ── Notification preferences ──────────────────────────────────────────────
    notifications: {
      email: { type: Boolean, default: true },
      sms:   { type: Boolean, default: false },
      push:  { type: Boolean, default: true },
    },

    // ── Auth tokens ───────────────────────────────────────────────────────────
    emailVerificationToken:  String,
    emailVerificationExpire: Date,
    resetPasswordToken:      String,
    resetPasswordExpire:     Date,

    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ role: 1, isActive: 1 });

// ─── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.getEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return token;
};

module.exports = mongoose.model('User', userSchema);