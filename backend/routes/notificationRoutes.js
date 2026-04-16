const express = require('express');
const router  = express.Router();
const {
  getNotifications, getUnreadCount,
  markAsRead, markAllRead,
  hideNotification, clearAll,
  handleAction,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // all routes require auth

router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.put('/mark-all-read', markAllRead);
router.delete('/clear-all',  clearAll);
router.put('/:id/read',      markAsRead);
router.put('/:id/action',    handleAction);
router.delete('/:id',        hideNotification);

module.exports = router;