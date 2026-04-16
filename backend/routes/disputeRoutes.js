const express = require('express');
const router  = express.Router();
const {
  raiseDispute, getMyDisputes, getDispute,
  addMessage, getAllDisputesAdmin, reviewDispute,
  markViewed, rateResolution,
} = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require login
router.use(protect);

// ── User (labour + client) ────────────────────────────────────────────────────
router.post('/',                 raiseDispute);
router.get('/my',                getMyDisputes);
router.get('/:id',               getDispute);
router.post('/:id/messages',     addMessage);
router.post('/:id/rate',         rateResolution);

// ── Admin only ────────────────────────────────────────────────────────────────
router.get('/admin/all',         authorize('admin'), getAllDisputesAdmin);
router.put('/:id/review',        authorize('admin'), reviewDispute);
router.post('/:id/mark-viewed',  authorize('admin'), markViewed);

module.exports = router;