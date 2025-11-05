const express = require('express');
const router = express.Router();

const {
    getNotificationsByProfile,
    getUnreadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile/:profileId')
    .get(protect, getNotificationsByProfile)
    .post(protect, createNotification);

router.route('/profile/:profileId/unread')
    .get(protect, getUnreadNotifications);

router.route('/profile/:profileId/mark-all-read')
    .put(protect, markAllAsRead);

router.route('/:id')
    .put(protect, markAsRead)
    .delete(protect, deleteNotification);

module.exports = router;