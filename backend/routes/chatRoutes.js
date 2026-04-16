const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteConversation,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { requireVerified } = require('../middleware/profileGuard');

router.use(protect);

// Image upload (in-memory for Cloudinary)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/conversations',                                requireVerified('chat'), getOrCreateConversation);
router.get('/conversations',                                 getMyConversations);
router.get('/conversations/:conversationId/messages',        getMessages);
router.post('/conversations/:conversationId/messages',       upload.single('image'), sendMessage);
router.put('/messages/:messageId',                           editMessage);
router.delete('/messages/:messageId',                        deleteMessage);

module.exports = router;