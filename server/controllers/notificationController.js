const db = require('../config/db');

const getNotificationsByUser = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
            [userId]
        );

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createNotification = async (req, res) => {
    try {
        const { user_id, message } = req.body;

        if (!user_id || !message) {
            return res.status(400).json({ message: 'User ID and message are required' });
        }

        // Only allow creating notifications for the logged-in user (for now)
        // In a production system, you might have admin roles that can create notifications for other users
        if (user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to create notifications for other users' });
        }

        const [newNotification] = await db.query(
            'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
            [user_id, message]
        );

        const [createdNotification] = await db.query(
            'SELECT * FROM Notifications WHERE notification_id = ?',
            [newNotification.insertId]
        );

        res.status(201).json(createdNotification[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;

        // Verify the notification belongs to the logged-in user
        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE notification_id = ?',
            [notificationId]
        );

        if (notifications.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notifications[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to update this notification' });
        }

        await db.query(
            'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ?',
            [notificationId]
        );

        const [updatedNotification] = await db.query(
            'SELECT * FROM Notifications WHERE notification_id = ?',
            [notificationId]
        );

        res.status(200).json(updatedNotification[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.user_id;

        await db.query(
            'UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;

        // Verify the notification belongs to the logged-in user
        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE notification_id = ?',
            [notificationId]
        );

        if (notifications.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notifications[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to delete this notification' });
        }

        await db.query('DELETE FROM Notifications WHERE notification_id = ?', [notificationId]);

        res.status(200).json({ message: `Notification with id ${notificationId} deleted successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getNotificationsByUser,
    getUnreadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};