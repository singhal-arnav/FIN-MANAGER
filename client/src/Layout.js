import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Layout({ onLogout, userEmail, selectedProfile, onSwitchProfile, isBusinessProfile }) {
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0); 

    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !selectedProfile?.profile_id) return;
            
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            const response = await axios.get(`${API_URL}/notifications/profile/${selectedProfile.profile_id}/unread`, authHeaders);
            setUnreadCount(response.data.length);
        } catch (err) {
            // Silently fail - don't break the layout if notifications fail
            console.error('Failed to fetch unread notifications count:', err);
        }
    };

    // Fetch unread count on mount and when location changes
    useEffect(() => {
        if (selectedProfile?.profile_id) {
            fetchUnreadCount();
        }
        
        // Refresh count every 30 seconds
        const interval = setInterval(() => {
            if (selectedProfile?.profile_id) {
                fetchUnreadCount();
            }
        }, 30000);
        
        // Listen for notification updates from NotificationsPage
        const handleNotificationUpdate = () => {
            if (selectedProfile?.profile_id) {
                fetchUnreadCount();
            }
        };
        window.addEventListener('notificationUpdated', handleNotificationUpdate);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationUpdated', handleNotificationUpdate);
        };
    }, [location.pathname, selectedProfile?.profile_id]); // Refresh when navigating or profile changes

    const getLinkClass = (path) => {
        const isActive = location.pathname === path || 
                        (path !== '/dashboard' && location.pathname.startsWith(path));
        
        return isActive 
            ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 text-primary"
            : "flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-primary/20 hover:text-primary rounded-lg transition-colors";
    };

    return (
        <div className="flex h-screen w-full">
            {/* Sidebar */}
            <aside className="flex w-64 flex-col border-r border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-4">
                <div className="flex items-center gap-3 px-3 py-2 mb-4">
                    <div className="text-primary size-8 flex items-center justify-center">
                        <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h1 className="text-text-light dark:text-text-dark text-lg font-bold">FinTrack</h1>
                </div>

                {/* Profile Indicator */}
                <div className="mb-4 p-3 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-sm">
                            {isBusinessProfile ? 'business' : 'person'}
                        </span>
                        <span className="text-text-light dark:text-text-dark text-sm font-semibold truncate">
                            {selectedProfile.profile_name}
                        </span>
                    </div>
                    <button
                        onClick={onSwitchProfile}
                        className="w-full text-xs text-primary hover:text-primary/80 transition-colors text-left flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                        Switch Profile
                    </button>
                </div>
                
                <div className="flex h-full flex-col justify-between">
                    <nav className="flex flex-col gap-2">
                        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                            <span className="material-symbols-outlined">dashboard</span>
                            <p className="text-sm font-medium">Dashboard</p>
                        </Link>
                        <Link to="/accounts" className={getLinkClass('/accounts')}>
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                            <p className="text-sm font-medium">Accounts</p>
                        </Link>
                        <Link to="/categories" className={getLinkClass('/categories')}>
                            <span className="material-symbols-outlined">receipt_long</span>
                            <p className="text-sm font-medium">Categories</p>
                        </Link>
                        <Link to="/budgets" className={getLinkClass('/budgets')}>
                            <span className="material-symbols-outlined">donut_small</span>
                            <p className="text-sm font-medium">Budgets</p>
                        </Link>
                        <Link to="/goals" className={getLinkClass('/goals')}>
                            <span className="material-symbols-outlined">bar_chart</span>
                            <p className="text-sm font-medium">Goals</p>
                        </Link>
                        <Link to="/investments" className={getLinkClass('/investments')}>
                            <span className="material-symbols-outlined">trending_up</span>
                            <p className="text-sm font-medium">Investments</p>
                        </Link>
                        <Link to="/recurring" className={getLinkClass('/recurring')}>
                            <span className="material-symbols-outlined">repeat</span>
                            <p className="text-sm font-medium">Recurring</p>
                        </Link>
                        <Link to="/notifications" className={getLinkClass('/notifications')}>
                            <span className="material-symbols-outlined">notifications</span>
                            <p className="text-sm font-medium">Notifications</p>
                            {unreadCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                        
                        {/* Business features - only show for business profiles */}
                        {isBusinessProfile && (
                            <>
                                <div className="h-px bg-border-light dark:bg-border-dark my-2"></div>
                                <Link to="/invoices" className={getLinkClass('/invoices')}>
                                    <span className="material-symbols-outlined">description</span>
                                    <p className="text-sm font-medium">Invoices</p>
                                </Link>
                                <Link to="/clients" className={getLinkClass('/clients')}>
                                    <span className="material-symbols-outlined">groups</span>
                                    <p className="text-sm font-medium">Clients</p>
                                </Link>
                            </>
                        )}
                    </nav>
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark">
                            <div className="bg-gradient-to-br from-primary to-primary/60 aspect-square rounded-full size-10 flex items-center justify-center">
                                <span className="text-white text-lg font-bold">
                                    {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-text-light dark:text-text-dark text-sm font-medium leading-tight truncate max-w-[120px]">
                                    {userEmail || 'User'}
                                </h1>
                            </div>
                        </div>
                        <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-primary/20 hover:text-primary rounded-lg transition-colors w-full">
                            <span className="material-symbols-outlined">logout</span>
                            <p className="text-sm font-medium">Logout</p>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                {/* TopNavBar */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-border-light dark:border-border-dark px-10 py-3 bg-card-light dark:bg-card-dark sticky top-0 z-10">
                    <h2 className="text-text-light dark:text-text-dark text-lg font-bold">
                        {selectedProfile.profile_name}
                    </h2>
                    <div className="flex flex-1 justify-end items-center gap-6">
                        <div className="bg-gradient-to-br from-primary to-primary/60 aspect-square rounded-full size-10 flex items-center justify-center">
                            <span className="text-white text-base font-bold">
                                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                            </span>
                        </div>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;