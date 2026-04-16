const express      = require('express');
const router       = express.Router();
const asyncHandler = require('express-async-handler');
const crypto       = require('crypto');
const { protect }  = require('../middleware/authMiddleware');
const User         = require('../models/userModel');
const sendEmail    = require('../utils/sendEmail');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Clean expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  otpStore.forEach((v, k) => { if (v.expiresAt < now) otpStore.delete(k); });
}, 5 * 60 * 1000);

// ── POST /api/otp/send ────────────────────────────────────────────────────────
router.post('/send', protect, asyncHandler(async (req, res) => {
  const { purpose } = req.body;

  const validPurposes = ['change_email', 'change_phone', 'change_password'];
  if (!purpose || !validPurposes.includes(purpose)) {
    res.status(400); throw new Error('Invalid OTP purpose');
  }

  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  // Rate limit: max 3 OTPs per 15 minutes per user+purpose
  const rateKey   = `rate:${req.user._id}:${purpose}`;
  const rateEntry = otpStore.get(rateKey) || { count: 0, window: Date.now() + 15 * 60 * 1000 };
  if (Date.now() < rateEntry.window && rateEntry.count >= 3) {
    const wait = Math.ceil((rateEntry.window - Date.now()) / 60000);
    res.status(429); throw new Error(`Too many OTP requests. Please wait ${wait} minute(s) before trying again.`);
  }
  if (Date.now() > rateEntry.window) {
    rateEntry.count = 0;
    rateEntry.window = Date.now() + 15 * 60 * 1000;
  }
  rateEntry.count++;
  otpStore.set(rateKey, rateEntry);

  const otp    = generateOTP();
  const key    = `${req.user._id}:${purpose}`;
  const expiry = Date.now() + OTP_EXPIRY;
  otpStore.set(key, { otp, expiresAt: expiry, userId: req.user._id.toString(), attempts: 0 });

  const purposeLabels = {
    change_email:    'Change Email',
    change_phone:    'Change Phone Number',
    change_password: 'Change Password',
  };

  const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  // ── Try to send email ──────────────────────────────────────────────────────
  let emailSent = false;
  let emailError = null;

  try {
    await sendEmail({
      to:      user.email,
      subject: `Labour Connect — OTP: ${otp} (${purposeLabels[purpose]})`,
      html: `
        <div style="font-family:'Outfit',sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Labour Connect</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:13px">${purposeLabels[purpose]}</p>
          </div>
          <div style="padding:32px 28px">
            <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>${user.name.split(' ')[0]}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 28px">Your one-time password (OTP) for <strong>${purposeLabels[purpose]}</strong> is:</p>
            <div style="background:#fff7ed;border:2px dashed #fed7aa;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
              <span style="font-size:40px;font-weight:900;color:#f97316;letter-spacing:10px">${otp}</span>
              <p style="color:#94a3b8;font-size:12px;margin:8px 0 0">Expires in <strong>10 minutes</strong></p>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:0">If you did not request this OTP, please ignore this email. Never share your OTP with anyone.</p>
          </div>
          <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #f1f5f9">
            <p style="color:#9ca3af;font-size:12px;margin:0">© ${new Date().getFullYear()} Labour Connect</p>
          </div>
        </div>
      `,
    });
    emailSent = true;
  } catch (err) {
    emailError = err.message;
    console.error('❌ OTP email failed:', err.message);
  }

  // If email failed, clear the OTP and return error
  if (!emailSent) {
    otpStore.delete(key);
    res.status(500);
    throw new Error(`Failed to send OTP email: ${emailError || 'Unknown error'}. Please check your email configuration.`);
  }

  res.json({
    success:   true,
    message:   `OTP sent to ${maskedEmail}. Check your inbox (and spam folder).`,
    emailSent: true,
  });
}));

// ── POST /api/otp/verify ──────────────────────────────────────────────────────
router.post('/verify', protect, asyncHandler(async (req, res) => {
  const { otp, purpose, newValue } = req.body;
  const key   = `${req.user._id}:${purpose}`;
  const stored = otpStore.get(key);

  if (!stored) {
    res.status(400); throw new Error('OTP expired or not found. Please request a new one.');
  }
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    res.status(400); throw new Error('OTP has expired. Please request a new one.');
  }
  // Track failed attempts (max 5)
  stored.attempts = (stored.attempts || 0) + 1;
  if (stored.attempts > 5) {
    otpStore.delete(key);
    res.status(429); throw new Error('Too many failed attempts. Please request a new OTP.');
  }
  if (stored.otp !== otp.trim()) {
    const remaining = 5 - stored.attempts;
    res.status(400);
    throw new Error(remaining > 0
      ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
      : 'Too many failed attempts. Please request a new OTP.'
    );
  }

  // OTP is correct — apply the change
  const user = await User.findById(req.user._id).select('+password');
  let message = 'Verified successfully';

  if (purpose === 'change_email' && newValue) {
    const exists = await User.findOne({ email: newValue, _id: { $ne: user._id } });
    if (exists) { res.status(400); throw new Error('This email is already in use by another account.'); }
    user.email = newValue;
    message = 'Email updated successfully';
  }

  if (purpose === 'change_phone' && newValue) {
    user.phone = newValue;
    message = 'Phone number updated successfully';
  }

  if (purpose === 'change_password' && newValue) {
    user.password = newValue;
    message = 'Password changed successfully';
  }

  await user.save({ validateBeforeSave: false });
  otpStore.delete(key);

  // Return updated user (without password)
  const updated = await User.findById(user._id).populate('labourProfile').populate('clientProfile');
  res.json({ success: true, message, data: updated });
}));

module.exports = router;