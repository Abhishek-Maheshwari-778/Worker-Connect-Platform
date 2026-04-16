const express = require('express');
const router  = express.Router();
const asyncHandler = require('express-async-handler');
const {
  submitContact, getContacts, getContactById,
  replyToContact, updateContact, deleteContact,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public — anyone can submit
router.post('/', submitContact);

// Admin only
router.get('/',         protect, authorize('admin'), getContacts);
router.get('/:id',      protect, authorize('admin'), getContactById);
router.post('/:id/reply', protect, authorize('admin'), replyToContact);
router.patch('/:id',    protect, authorize('admin'), updateContact);
router.delete('/:id',   protect, authorize('admin'), deleteContact);

module.exports = router;