const asyncHandler  = require('express-async-handler');
const crypto        = require('crypto');
const User          = require('../models/userModel');
const LabourProfile = require('../models/labourProfileModel');
const ClientProfile = require('../models/clientProfileModel');
const sendEmail     = require('../utils/sendEmail');
const { sendTokenResponse } = require('../utils/tokenHelper');

// ─── @desc   Register a new user
// ─── @route  POST /api/auth/register
// ─── @access Public
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email is already registered');
  }

  // Sanitize phone — send undefined if empty to skip validation
  const cleanPhone = phone && phone.trim() ? phone.trim() : undefined;

  const user = await User.create({ 
    name:     name.trim(), 
    email:    email.toLowerCase().trim(), 
    phone:    cleanPhone, 
    password, 
    role: role || 'labour',
  });

  // Create corresponding profile shell
  if (role === 'labour') {
    const profile = await LabourProfile.create({
      user:         user._id,
      dailyWageMin: 0,
      dailyWageMax: 0,
    });
    user.labourProfile = profile._id;
  } else if (role === 'client') {
    const profile = await ClientProfile.create({ 
      user:               user._id,
      verificationStatus: 'not_submitted',  // explicit — no pending default
    });
    user.clientProfile = profile._id;
  }
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verifyToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    await sendEmail({
      to:      user.email,
      subject: 'Labour Connect – Verify Your Email',
      html: `<p>Hi ${user.name},</p><p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`,
    });
  } catch (emailErr) {
    console.error('Verification email failed:', emailErr.message);
  }

  sendTokenResponse(user, 201, res, 'Registration successful');
});

// ─── @desc   Login user — supports role-based login for same email
// ─── @route  POST /api/auth/login
// ─── @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // ── Base query: match email ───────────────────────────────────────────────
  let query = { email };

  // ── If a role is provided, find that specific account ─────────────────────
  // This allows one person to have both a labour AND client account
  // with the same email but different role records
  if (role && role !== '') {
    query.role = role;
  }

  let user = await User.findOne(query).select('+password');

  // ── If role-specific lookup fails, try without role ───────────────────────
  if (!user && role) {
    user = await User.findOne({ email }).select('+password');
    if (user) {
      // Found user but wrong role — give helpful message
      res.status(401);
      throw new Error(
        `No ${role} account found for this email. You are registered as a ${user.role}. Please select the correct role or register a new ${role} account.`
      );
    }
  }

  if (!user) {
    res.status(401);
    throw new Error('No account found with this email address');
  }

  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Incorrect password. Please try again.');
  }

  if (user.isSuspended) {
    res.status(403);
    throw new Error('Account suspended. Contact support@labourconnect.in');
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful');
});

// ─── @desc   Logout user
// ─── @route  POST /api/auth/logout
// ─── @access Private
const logout = asyncHandler(async (_req, res) => {
  res.cookie('token', 'none', {
    expires:  new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─── @desc   Get current user
// ─── @route  GET /api/auth/me
// ─── @access Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('labourProfile')
    .populate('clientProfile');

  res.status(200).json({ success: true, data: user });
});

// ─── @desc   Verify email
// ─── @route  GET /api/auth/verify-email/:token
// ─── @access Public
const verifyEmail = asyncHandler(async (req, res) => {
  const hashed = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken:  hashed,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification link');
  }

  user.isVerified = true;
  user.emailVerificationToken  = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

// ─── @desc   Forgot password
// ─── @route  POST /api/auth/forgot-password
// ─── @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404);
    throw new Error('No account found with that email');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to:      user.email,
    subject: 'Labour Connect – Password Reset',
    html:    `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
  });

  res.status(200).json({ success: true, message: 'Password reset email sent' });
});

// ─── @desc   Reset password
// ─── @route  PUT /api/auth/reset-password/:token
// ─── @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset link');
  }

  user.password            = req.body.password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// ─── @desc   Update password (logged in)
// ─── @route  PUT /api/auth/update-password
// ─── @access Private
const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// ─── @desc   Check which roles exist for an email (for login UI hint)
// ─── @route  POST /api/auth/check-email
// ─── @access Public
const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(200).json({ success: true, roles: [] });
  }

  const users = await User.find({ email }).select('role name avatar');
  const roles = users.map(u => ({
    role:   u.role,
    name:   u.name,
    avatar: u.avatar,
  }));

  res.status(200).json({ success: true, roles });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  checkEmail,
};