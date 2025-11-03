const express = require('express');
const router = express.Router();

const {
    getNotificationsByUser,
    getUnreadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getNotificationsByUser)
    .post(protect, createNotification);

router.route('/unread')
    .get(protect, getUnreadNotifications);

router.route('/mark-all-read')
    .put(protect, markAllAsRead);

router.route('/:id')
    .put(protect, markAsRead)
    .delete(protect, deleteNotification);

module.exports = router;