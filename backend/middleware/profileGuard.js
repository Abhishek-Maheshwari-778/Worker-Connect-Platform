/**
 * Profile Guard Middleware
 * Enforces profile completion + Aadhaar verification before key actions.
 *
 * Labour: Must have skills set + dailyWage set + Aadhaar approved
 * Client: Must have Aadhaar approved
 */

const asyncHandler  = require('express-async-handler');
const LabourProfile = require('../models/labourProfileModel');
const ClientProfile = require('../models/clientProfileModel');

/**
 * requireVerified(action)
 * action: 'apply_job' | 'post_job' | 'chat'
 */
const requireVerified = (action = 'action') => asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (user.role === 'labour') {
    // ── Labour checks ─────────────────────────────────────────────────────────
    const profile = await LabourProfile.findOne({ user: user._id });

    const checks = {
      hasProfile:    !!profile,
      hasSkills:     (profile?.skills?.length || 0) > 0,
      hasWage:       (profile?.dailyWageMin || 0) > 0 && (profile?.dailyWageMax || 0) > 0,
      isVerified:    profile?.verificationStatus === 'approved',
      isPending:     profile?.verificationStatus === 'pending',
    };

    if (!checks.hasProfile || !checks.hasSkills || !checks.hasWage) {
      res.status(403);
      return res.json({
        success:    false,
        blocked:    true,
        blockType:  'incomplete_profile',
        message:    'Please complete your profile before applying to jobs.',
        details:    {
          hasSkills: checks.hasSkills,
          hasWage:   checks.hasWage,
        },
        action:     'complete_profile',
        redirectTo: '/labour/settings',
      });
    }

    if (checks.isPending) {
      res.status(403);
      return res.json({
        success:    false,
        blocked:    true,
        blockType:  'verification_pending',
        message:    'Your Aadhaar is under review. You can apply to jobs once verified.',
        action:     'wait_verification',
        redirectTo: '/labour/settings',
      });
    }

    if (!checks.isVerified) {
      res.status(403);
      return res.json({
        success:    false,
        blocked:    true,
        blockType:  'not_verified',
        message:    'Please upload and get your Aadhaar verified to apply for jobs.',
        action:     'upload_aadhaar',
        redirectTo: '/labour/settings',
      });
    }

  } else if (user.role === 'client') {
    // ── Client checks ─────────────────────────────────────────────────────────
    const profile = await ClientProfile.findOne({ user: user._id });

    const isVerified = profile?.verificationStatus === 'approved';
    const isPending  = profile?.verificationStatus === 'pending';

    if (isPending) {
      res.status(403);
      return res.json({
        success:    false,
        blocked:    true,
        blockType:  'verification_pending',
        message:    action === 'post_job'
          ? 'Your Aadhaar is under review. You can post jobs once verified.'
          : 'Your Aadhaar is under review. You can chat with workers once verified.',
        action:     'wait_verification',
        redirectTo: '/client/settings',
      });
    }

    if (!isVerified) {
      res.status(403);
      return res.json({
        success:    false,
        blocked:    true,
        blockType:  'not_verified',
        message:    action === 'post_job'
          ? 'Please upload and verify your Aadhaar to post jobs. This protects workers from fraudulent postings.'
          : 'Please verify your identity to chat with workers.',
        action:     'upload_aadhaar',
        redirectTo: '/client/settings',
      });
    }
  }

  next();
});

module.exports = { requireVerified };