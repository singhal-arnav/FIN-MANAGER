const db = require('../config/db');

const getNotificationsByProfile = async (req, res) => {
    try {
        const { profileId } = req.params;

        // Verify the profile belongs to the logged-in user
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view notifications for this profile' });
        }

        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE profile_id = ? ORDER BY created_at DESC',
            [profileId]
        );

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getUnreadNotifications = async (req, res) => {
    try {
        const { profileId } = req.params;

        // Verify the profile belongs to the logged-in user
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view notifications for this profile' });
        }

        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE profile_id = ? AND is_read = FALSE ORDER BY created_at DESC',
            [profileId]
        );

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createNotification = async (req, res) => {
    try {
        const { profile_id, message } = req.body;

        if (!profile_id || !message) {
            return res.status(400).json({ message: 'Profile ID and message are required' });
        }

        // Verify the profile belongs to the logged-in user
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to create notifications for this profile' });
        }

        const [newNotification] = await db.query(
            'INSERT INTO Notifications (profile_id, message) VALUES (?, ?)',
            [profile_id, message]
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

        // Verify the notification belongs to a profile owned by the logged-in user
        const [notifications] = await db.query(
            'SELECT N.*, P.user_id FROM Notifications N JOIN Profiles P ON N.profile_id = P.profile_id WHERE N.notification_id = ?',
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
        const { profileId } = req.params;

        // Verify the profile belongs to the logged-in user
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to mark notifications for this profile' });
        }

        await db.query(
            'UPDATE Notifications SET is_read = TRUE WHERE profile_id = ? AND is_read = FALSE',
            [profileId]
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

        // Verify the notification belongs to a profile owned by the logged-in user
        const [notifications] = await db.query(
            'SELECT N.*, P.user_id FROM Notifications N JOIN Profiles P ON N.profile_id = P.profile_id WHERE N.notification_id = ?',
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
    getNotificationsByProfile,
    getUnreadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};