// const express  = require('express');
// const router   = express.Router();
// const {
//   createJob,
//   getJobs,
//   getJobById,
//   updateJob,
//   deleteJob,
//   applyToJob,
//   withdrawApplication,
//   updateApplicantStatus,
//   getMyJobPostings,
//   getMyApplications,
//   completeJob,
//   getClientWorkHistory   // ✅ ADD THIS
// } = require('../controllers/jobController');

// const { protect, authorize }   = require('../middleware/authMiddleware');
// const { requireVerified }      = require('../middleware/profileGuard');
// const { createJobValidator }   = require('../middleware/validationMiddleware');
// const { uploadJobImages, handleUploadError } = require('../middleware/uploadMiddleware');

// // ── Public (list) ──────────────────────────────────────────────────────────────
// router.get('/', getJobs);

// // ── Static named routes MUST come before /:id ──────────────────────────────────
// // Client
// router.get('/my-postings',    protect, authorize('client'), getMyJobPostings);
// // Labour
// router.get('/my-applications',   protect, authorize('labour'), getMyApplications);
// router.get('/my-client-history', protect, authorize('labour'), getClientWorkHistory);

// // ── Dynamic /:id routes ────────────────────────────────────────────────────────
// router.get('/:id', getJobById);

// // ── Client-only ────────────────────────────────────────────────────────────────
// router.post(
//   '/',
//   protect,
//   authorize('client'),
//   requireVerified('post_job'),
//   handleUploadError(uploadJobImages.array('images', 5)),
//   createJobValidator,
//   createJob
// );

// router.put('/:id',         protect, authorize('client', 'admin'), updateJob);
// router.delete('/:id',      protect, authorize('client', 'admin'), deleteJob);
// router.put('/:id/complete',protect, authorize('client'), completeJob);

// router.put(
//   '/:id/applicants/:labourId',
//   protect,
//   authorize('client'),
//   updateApplicantStatus
// );

// // ── Labour-only ────────────────────────────────────────────────────────────────
// router.post('/:id/apply',   protect, authorize('labour'), requireVerified('apply_job'), applyToJob);
// router.delete('/:id/apply', protect, authorize('labour'), withdrawApplication);

// module.exports = router;


const express  = require('express');
const router   = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  withdrawApplication,
  updateApplicantStatus,
  getMyJobPostings,
  getMyApplications,
  completeJob,
  getClientWorkHistory,
  saveJob,
  unsaveJob,
  getSavedJobs,
} = require('../controllers/jobController');

const { protect, authorize }   = require('../middleware/authMiddleware');
const { requireVerified }      = require('../middleware/profileGuard');
const { createJobValidator }   = require('../middleware/validationMiddleware');
const { uploadJobImages, handleUploadError } = require('../middleware/uploadMiddleware');

// ── Public (list) ──────────────────────────────────────────────────────────────
router.get('/', getJobs);

// ── Static named routes MUST come before /:id ──────────────────────────────────
router.get('/my-postings',    protect, authorize('client'), getMyJobPostings);
router.get('/my-applications',   protect, authorize('labour'), getMyApplications);
router.get('/my-client-history', protect, authorize('labour'), getClientWorkHistory);
router.get('/saved',             protect, authorize('labour'), getSavedJobs);

// ── Dynamic /:id routes ────────────────────────────────────────────────────────
router.get('/:id', getJobById);

// ── Client-only ────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('client'),
  requireVerified('post_job'),
  handleUploadError(uploadJobImages.array('images', 5)),
  createJobValidator,
  createJob
);

router.put('/:id',         protect, authorize('client', 'admin'), updateJob);
router.delete('/:id',      protect, authorize('client', 'admin'), deleteJob);
router.put('/:id/complete',protect, authorize('client'), completeJob);

router.put(
  '/:id/applicants/:labourId',
  protect,
  authorize('client'),
  updateApplicantStatus
);

// ── Labour-only ────────────────────────────────────────────────────────────────
router.post('/:id/apply',   protect, authorize('labour'), requireVerified('apply_job'), applyToJob);
router.delete('/:id/apply', protect, authorize('labour'), withdrawApplication);
router.post('/:id/save',    protect, authorize('labour'), saveJob);
router.delete('/:id/save',  protect, authorize('labour'), unsaveJob);

module.exports = router;