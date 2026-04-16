const asyncHandler  = require('express-async-handler');
const User          = require('../models/userModel');
const LabourProfile = require('../models/labourProfileModel');
const ClientProfile = require('../models/clientProfileModel');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

// ─── @desc   Update basic user profile (name, phone, location, notifications)
// ─── @route  PUT /api/users/profile
// ─── @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
  // Use findById + direct assignment + save() for maximum reliability
  // findByIdAndUpdate can silently skip fields due to Mongoose casting issues
  const user = await User.findById(req.user._id)
    .populate('labourProfile')
    .populate('clientProfile');

  if (!user) { res.status(404); throw new Error('User not found'); }

  const body = req.body;

  // ── Simple string/number fields ───────────────────────────────────────────
  if (body.name    !== undefined) user.name    = body.name.trim();
  if (body.phone   !== undefined) user.phone   = body.phone;
  if (body.gender  !== undefined) user.gender  = body.gender;

  // ── Date of Birth — accept YYYY-MM-DD string or Date ─────────────────────
  if (body.dob !== undefined && body.dob !== '') {
    user.dob = new Date(body.dob);
  } else if (body.dob === '') {
    user.dob = undefined;
  }

  // ── Location — update only provided sub-fields ────────────────────────────
  const loc = body.location || {};
  const flat = body; // also accept flat fields: address, city, state, pincode

  // Ensure location object exists
  if (!user.location) user.location = { type: 'Point', coordinates: [0, 0] };

  const addr    = flat.address  ?? loc.address;
  const city    = flat.city     ?? loc.city;
  const state   = flat.state    ?? loc.state;
  const pincode = flat.pincode  ?? loc.pincode;

  if (addr    !== undefined) user.location.address = addr;
  if (city    !== undefined) user.location.city    = city;
  if (state   !== undefined) user.location.state   = state;
  if (pincode !== undefined) user.location.pincode = pincode;

  // ── Notifications ─────────────────────────────────────────────────────────
  if (body.notifications) {
    user.notifications = { ...user.notifications, ...body.notifications };
  }

  // ── Emergency Contact ────────────────────────────────────────────────────
  if (body.emergencyContact) {
    const ec = body.emergencyContact;

    // Validate emergency phone format
    if (ec.phone && !/^[6-9]\d{9}$/.test(ec.phone)) {
      res.status(400);
      throw new Error('Emergency contact must be a valid 10-digit Indian mobile number');
    }

    // CRITICAL: emergency phone must NOT match the user's own phone
    const userPhone = body.phone || user.phone;
    if (ec.phone && userPhone && ec.phone === userPhone) {
      res.status(400);
      throw new Error('Emergency contact number must be different from your own mobile number');
    }

    // Ensure name is provided with the phone
    if (ec.phone && !ec.name?.trim()) {
      res.status(400);
      throw new Error('Please provide the emergency contact person\'s name');
    }

    if (!user.emergencyContact) user.emergencyContact = {};
    if (ec.name     !== undefined) user.emergencyContact.name     = ec.name.trim();
    if (ec.phone    !== undefined) user.emergencyContact.phone    = ec.phone;
    if (ec.relation !== undefined) user.emergencyContact.relation = ec.relation.trim();
  }

  // Save — bypass password hash middleware (password not modified)
  await user.save({ validateBeforeSave: false });

  // Re-fetch with populated profiles for the response
  const updated = await User.findById(user._id)
    .populate('labourProfile')
    .populate('clientProfile');

  successResponse(res, 200, 'Profile updated', updated);
});

// ─── @desc   Upload / update avatar
// ─── @route  PUT /api/users/avatar
// ─── @access Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  const user = await User.findById(req.user._id);

  // Delete old avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  const result = await uploadToCloudinary(req.file.buffer, 'labour-connect/avatars', 'image');

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save({ validateBeforeSave: false });

  successResponse(res, 200, 'Avatar updated', { avatar: user.avatar });
});

// ─── @desc   Update labour-specific profile
// ─── @route  PUT /api/users/labour-profile
// ─── @access Private (labour)
const updateLabourProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'skills', 'bio', 'experience', 'dailyWageMin', 'dailyWageMax',
    'workingHours', 'preferredShift', 'workingRadius', 'availableFrom',
    'isAvailable', 'preferredCategories', 'languages',
  ];

  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  // Convert empty-string numbers to undefined (prevent casting errors)
  if (updates.dailyWageMin === '' || updates.dailyWageMin === null) updates.dailyWageMin = 0;
  if (updates.dailyWageMax === '' || updates.dailyWageMax === null) updates.dailyWageMax = 0;
  if (updates.experience === '' || updates.experience === null) updates.experience = 0;
  if (updates.workingRadius === '' || updates.workingRadius === null) updates.workingRadius = 20;

  const profile = await LabourProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: false, upsert: true }
  );

  // Mark profile complete if core fields filled
  const isComplete = (profile.skills?.length > 0) || (profile.dailyWageMin > 0);
  if (isComplete) {
    await User.findByIdAndUpdate(req.user._id, { isProfileComplete: true });
  }

  successResponse(res, 200, 'Labour profile updated', profile);
});

// ─── @desc   Upload Aadhaar document
// ─── @route  PUT /api/users/aadhaar
// ─── @access Private (labour)
const uploadAadhaar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload the Aadhaar document');
  }

  // Use 'raw' for PDF, 'image' for images — Cloudinary requires correct resource_type
  const isPdf = req.file.mimetype === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';
  const result = await uploadToCloudinary(req.file.buffer, 'labour-connect/documents/aadhaar', resourceType);

  const profile = await LabourProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      aadhaarDoc: {
        url:      result.secure_url,
        publicId: result.public_id,
        status:   'pending',
      },
      verificationStatus: 'pending',
    },
    { new: true }
  );

  successResponse(res, 200, 'Aadhaar uploaded and pending verification', {
    verificationStatus: profile.verificationStatus,
  });
});

// ─── @desc   Upload Aadhaar document (client)
// ─── @route  PUT /api/users/client-aadhaar
// ─── @access Private (client)
const uploadClientAadhaar = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload the Aadhaar document'); }

  // Use 'raw' for PDF, 'image' for images — Cloudinary requires correct resource_type
  const isPdf = req.file.mimetype === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';
  const result = await uploadToCloudinary(req.file.buffer, 'labour-connect/documents/aadhaar', resourceType);

  // Use $set with dot notation to avoid strict-mode issues on older schema versions
  const profile = await ClientProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        'aadhaarDoc.url':       result.secure_url,
        'aadhaarDoc.publicId':  result.public_id,
        'aadhaarDoc.status':    'pending',
        'aadhaarDoc.reviewedAt': null,
        verificationStatus:     'pending',
      },
    },
    { new: true, upsert: true, strict: false }
  );

  // Notify admins via socket
  const io = req.app.locals.io;
  if (io) io.emit('admin:newVerification', { role: 'client', userId: req.user._id });

  successResponse(res, 200, 'Aadhaar uploaded and pending verification', {
    verificationStatus: profile?.verificationStatus || 'pending',
  });
});

// ─── @desc   Add portfolio images
// ─── @route  POST /api/users/portfolio
// ─── @access Private (labour)
const addPortfolioImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('Please upload at least one image');
  }

  const profile = await LabourProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Labour profile not found');
  }

  if (profile.portfolioImages.length + req.files.length > 10) {
    res.status(400);
    throw new Error('Maximum 10 portfolio images allowed');
  }

  const newImages = [];
  for (const file of req.files) {
    const result = await uploadToCloudinary(file.buffer, 'labour-connect/portfolio', 'image');
    newImages.push({
      url:      result.secure_url,
      publicId: result.public_id,
      caption:  req.body.caption || '',
    });
  }

  profile.portfolioImages.push(...newImages);
  await profile.save();

  successResponse(res, 200, 'Portfolio images added', profile.portfolioImages);
});

// ─── @desc   Delete a portfolio image
// ─── @route  DELETE /api/users/portfolio/:imageId
// ─── @access Private (labour)
const deletePortfolioImage = asyncHandler(async (req, res) => {
  const profile = await LabourProfile.findOne({ user: req.user._id });

  const imgIndex = profile.portfolioImages.findIndex(
    (img) => img._id.toString() === req.params.imageId
  );

  if (imgIndex === -1) {
    res.status(404);
    throw new Error('Image not found');
  }

  const [removed] = profile.portfolioImages.splice(imgIndex, 1);
  await deleteFromCloudinary(removed.publicId);
  await profile.save();

  successResponse(res, 200, 'Portfolio image deleted');
});

// ─── @desc   Update client profile
// ─── @route  PUT /api/users/client-profile
// ─── @access Private (client)
const updateClientProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'companyName', 'companyType', 'industryType',
    'gstNumber', 'websiteUrl', 'preferredPaymentMode',
  ];

  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const profile = await ClientProfile.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true, upsert: true }
  );

  await User.findByIdAndUpdate(req.user._id, { isProfileComplete: true });

  successResponse(res, 200, 'Client profile updated', profile);
});

// ─── @desc   Get public labour profile by userId
// ─── @route  GET /api/users/labour/:userId
// ─── @access Public
const getLabourPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, role: 'labour' })
    .select('-password -emailVerificationToken -resetPasswordToken')
    .populate({
      path: 'labourProfile',
      select: '-aadhaarDoc -aadhaarNumber',
    });

  if (!user) {
    res.status(404);
    throw new Error('Labour profile not found');
  }

  successResponse(res, 200, 'Labour profile fetched', user);
});

// ─── @desc   Browse labourers with filters
// ─── @route  GET /api/users/labourers
// ─── @access Public
const browseLabourers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const {
    skill, city, lng, lat, radius = 30,
    minRating, maxWage, isAvailable,
    verificationStatus, sortBy = 'averageRating', order = 'desc',
  } = req.query;

  const profileFilter = {};
  if (skill)              profileFilter['skills.name']     = { $regex: skill, $options: 'i' };
  if (isAvailable)        profileFilter.isAvailable        = isAvailable === 'true';
  if (verificationStatus) profileFilter.verificationStatus = verificationStatus;
  if (minRating)          profileFilter.averageRating      = { $gte: Number(minRating) };
  if (maxWage)            profileFilter.dailyWageMax       = { $lte: Number(maxWage) };

  const userFilter = { role: 'labour', isActive: true, isSuspended: false };
  if (city) userFilter['location.city'] = { $regex: city, $options: 'i' };

  if (lng && lat) {
    userFilter['location.coordinates'] = {
      $near: {
        $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: Number(radius) * 1000,
      },
    };
  }

  const matchingProfiles = await LabourProfile.find(profileFilter).select('user');
  const labourIds = matchingProfiles.map((p) => p.user);
  userFilter._id = { $in: labourIds };

  const [labourers, total] = await Promise.all([
    User.find(userFilter)
      .select('name avatar location isVerified')
      .populate({
        path:   'labourProfile',
        select: 'skills experience dailyWageMin dailyWageMax averageRating totalRatings badges isAvailable completedJobs verificationStatus',
      })
      .sort({ [sortBy === 'rating' ? 'labourProfile.averageRating' : 'createdAt']: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(userFilter),
  ]);

  paginatedResponse(res, labourers, total, page, limit, 'Labourers fetched');
});
const getClientPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, role: 'client' })
    .select('-password -emailVerificationToken -resetPasswordToken -phone -email')
    .populate({
      path: 'clientProfile',
      select: '-aadhaarDoc -aadhaarNumber -gstNumber',
    });

  if (!user) {
    res.status(404);
    throw new Error('Client profile not found');
  }

  const Job = require('../models/jobModel');
  const jobStats = await Job.aggregate([
    { $match: { postedBy: user._id } },
    { 
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completedJobs: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        openJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        totalHires: { $sum: { $size: { $ifNull: ['$hiredLabourers', []] } } }
      }
    }
  ]);

  const stats = jobStats[0] || {
    totalJobs: 0,
    completedJobs: 0,
    openJobs: 0,
    totalHires: 0
  };

  successResponse(res, 200, 'Client profile fetched', {
    ...user.toObject(),
    stats
  });
});

module.exports = {
  updateUserProfile,
  uploadAvatar,
  updateLabourProfile,
  uploadAadhaar,
  uploadClientAadhaar,
  addPortfolioImages,
  deletePortfolioImage,
  updateClientProfile,
  getLabourPublicProfile,
  browseLabourers,
  getClientPublicProfile
};