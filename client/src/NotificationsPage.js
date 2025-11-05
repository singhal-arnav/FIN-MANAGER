import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function NotificationsPage({ selectedProfile }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'unread'

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!selectedProfile?.profile_id) {
            setError('No profile selected.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const profileId = selectedProfile.profile_id;
            const endpoint = filter === 'unread' 
                ? `${API_URL}/notifications/profile/${profileId}/unread`
                : `${API_URL}/notifications/profile/${profileId}`;
            
            const response = await axios.get(endpoint, authHeaders);
            setNotifications(response.data);
        } catch (err) {
            setError('Could not load notifications.');
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, selectedProfile?.profile_id]);

    // Handlers
    const handleMarkAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.put(`${API_URL}/notifications/${notificationId}`, {}, authHeaders);
            
            setNotifications(notifications.map(n => 
                n.notification_id === notificationId 
                    ? { ...n, is_read: true }
                    : n
            ));
            
            // Trigger custom event to refresh sidebar count
            window.dispatchEvent(new CustomEvent('notificationUpdated'));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!selectedProfile?.profile_id) return;

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.put(`${API_URL}/notifications/profile/${selectedProfile.profile_id}/mark-all-read`, {}, authHeaders);
            
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            
            // Trigger custom event to refresh sidebar count
            window.dispatchEvent(new CustomEvent('notificationUpdated'));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.delete(`${API_URL}/notifications/${notificationId}`, authHeaders);
            
            setNotifications(notifications.filter(n => n.notification_id !== notificationId));
            
            // Trigger custom event to refresh sidebar count
            window.dispatchEvent(new CustomEvent('notificationUpdated'));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    // Render
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading Notifications...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">
                Notifications
            </h2>
            
            <div className="flex flex-col gap-6">
                {/* Filter and Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                filter === 'all' 
                                    ? 'bg-primary text-white' 
                                    : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-primary/20'
                            }`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                filter === 'unread' 
                                    ? 'bg-primary text-white' 
                                    : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-primary/20'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <span className="material-symbols-outlined text-6xl text-text-muted-light dark:text-text-muted-dark mb-4">
                                notifications_off
                            </span>
                            <p className="text-text-muted-light dark:text-text-muted-dark">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map(notification => (
                                <div 
                                    key={notification.notification_id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                                        notification.is_read 
                                            ? 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark' 
                                            : 'bg-primary/10 border-primary'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="material-symbols-outlined text-primary text-xl">
                                            {notification.is_read ? 'notifications' : 'notifications_active'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="text-text-light dark:text-text-dark text-sm font-medium mb-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-text-muted-light dark:text-text-muted-dark text-xs">
                                            {new Date(notification.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {!notification.is_read && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notification.notification_id)}
                                                className="text-primary hover:text-primary/80 transition-colors p-1"
                                                title="Mark as read"
                                            >
                                                <span className="material-symbols-outlined text-lg">done</span>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteNotification(notification.notification_id)}
                                            className="text-negative hover:text-negative/80 transition-colors p-1"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NotificationsPage;