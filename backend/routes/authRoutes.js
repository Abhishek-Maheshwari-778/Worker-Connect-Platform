const express  = require('express');
const router   = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  checkEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidator,
  loginValidator,
} = require('../middleware/validationMiddleware');

// ── Public routes ──────────────────────────────────────────────────────────────
router.post('/register',          registerValidator, register);
router.post('/login',             login);
router.post('/check-email',       checkEmail);
router.post('/forgot-password',   forgotPassword);
router.put('/reset-password/:token',  resetPassword);
router.get('/verify-email/:token',    verifyEmail);

// ── Protected routes ───────────────────────────────────────────────────────────
router.post('/logout',          protect, logout);
router.get('/me',               protect, getMe);
router.put('/update-password',  protect, updatePassword);

module.exports = router;