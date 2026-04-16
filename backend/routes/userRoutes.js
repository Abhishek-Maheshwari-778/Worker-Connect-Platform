const express  = require('express');
const router   = express.Router();
const {
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
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  uploadAvatar:    avatarUpload,
  uploadDocument:  docUpload,
  uploadPortfolio: portfolioUpload,
  handleUploadError,
} = require('../middleware/uploadMiddleware');

// ── Public ─────────────────────────────────────────────────────────────────────
router.get('/labourers',        browseLabourers);
router.get('/labour/:userId',   getLabourPublicProfile);

// ── Authenticated (any role) ───────────────────────────────────────────────────
router.put('/profile', protect, updateUserProfile);
router.put('/avatar',  protect, handleUploadError(avatarUpload.single('avatar')), uploadAvatar);

// ── Labour-only ────────────────────────────────────────────────────────────────
router.put('/labour-profile', protect, authorize('labour'), updateLabourProfile);
router.get('/client/:userId', getClientPublicProfile);

router.put(
  '/client-aadhaar',
  protect,
  handleUploadError(docUpload.single('aadhaar')),
  uploadClientAadhaar
);

router.put(
  '/aadhaar',
  protect,
  authorize('labour'),
  handleUploadError(docUpload.single('aadhaar')),
  uploadAadhaar
);

router.post(
  '/portfolio',
  protect,
  authorize('labour'),
  handleUploadError(portfolioUpload.array('images', 10)),
  addPortfolioImages
);

router.delete('/portfolio/:imageId', protect, authorize('labour'), deletePortfolioImage);

// ── Client-only ────────────────────────────────────────────────────────────────
router.put('/client-profile', protect, authorize('client'), updateClientProfile);

module.exports = router;