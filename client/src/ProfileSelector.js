import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function ProfileSelector({ onProfileSelect }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [profileName, setProfileName] = useState('');
    const [profileType, setProfileType] = useState('personal');
    const [formError, setFormError] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const response = await axios.get(`${API_URL}/profiles`, authHeaders);
            setProfiles(response.data);
        } catch (err) {
            setError('Failed to load profiles. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProfile = (profile) => {
        // Store selected profile in localStorage
        localStorage.setItem('selectedProfile', JSON.stringify(profile));
        onProfileSelect(profile);
        navigate('/dashboard');
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!profileName.trim()) {
            setFormError('Profile name is required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const body = {
                profile_name: profileName,
                profile_type: profileType
            };

            if (editingProfile) {
                // Update existing profile
                await axios.put(`${API_URL}/profiles/${editingProfile.profile_id}`, body, authHeaders);
            } else {
                // Create new profile
                await axios.post(`${API_URL}/profiles`, body, authHeaders);
            }

            // Refresh profiles list
            await fetchProfiles();
            
            // Reset form
            setShowForm(false);
            setEditingProfile(null);
            setProfileName('');
            setProfileType('personal');
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save profile');
        }
    };

    const handleEditProfile = (profile) => {
        setEditingProfile(profile);
        setProfileName(profile.profile_name);
        setProfileType(profile.profile_type);
        setShowForm(true);
    };

    const handleDeleteProfile = async (profileId) => {
        if (!window.confirm('Are you sure you want to delete this profile? All associated data will be permanently deleted.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.delete(`${API_URL}/profiles/${profileId}`, authHeaders);
            await fetchProfiles();
        } catch (err) {
            setError('Failed to delete profile');
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingProfile(null);
        setProfileName('');
        setProfileType('personal');
        setFormError('');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('selectedProfile');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-text-muted-light dark:text-text-muted-dark">Loading profiles...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-text-light dark:text-text-dark text-3xl font-bold mb-2">Select a Profile</h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark">Choose which financial profile you'd like to manage</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted-light dark:text-text-muted-dark hover:text-negative transition-colors"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Logout
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-negative/10 border border-negative rounded-lg">
                        <p className="text-negative text-sm">{error}</p>
                    </div>
                )}

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {profiles.map(profile => (
                        <div 
                            key={profile.profile_id}
                            className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6 hover:border-primary transition-colors cursor-pointer group"
                        >
                            <div onClick={() => handleSelectProfile(profile)} className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`size-12 rounded-full flex items-center justify-center ${
                                        profile.profile_type === 'business' 
                                            ? 'bg-primary/20 text-primary' 
                                            : 'bg-positive/20 text-positive'
                                    }`}>
                                        <span className="material-symbols-outlined text-2xl">
                                            {profile.profile_type === 'business' ? 'business' : 'person'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-text-light dark:text-text-dark text-lg font-bold group-hover:text-primary transition-colors">
                                            {profile.profile_name}
                                        </h3>
                                        <p className="text-text-muted-light dark:text-text-muted-dark text-sm capitalize">
                                            {profile.profile_type}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-4 border-t border-border-light dark:border-border-dark">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditProfile(profile);
                                    }}
                                    className="flex-1 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProfile(profile.profile_id);
                                    }}
                                    className="flex-1 px-3 py-2 text-sm text-negative border border-negative rounded-lg hover:bg-negative/10 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Profile Card */}
                    <div 
                        onClick={() => setShowForm(true)}
                        className="bg-card-light dark:bg-card-dark rounded-xl border-2 border-dashed border-border-light dark:border-border-dark p-6 hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px] group"
                    >
                        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
                            <span className="material-symbols-outlined text-2xl text-primary">add</span>
                        </div>
                        <p className="text-text-light dark:text-text-dark font-semibold group-hover:text-primary transition-colors">
                            Create New Profile
                        </p>
                    </div>
                </div>

                {profiles.length === 0 && !showForm && (
                    <div className="text-center py-12">
                        <p className="text-text-muted-light dark:text-text-muted-dark mb-4">
                            You haven't created any profiles yet. Create your first profile to get started!
                        </p>
                    </div>
                )}

                {/* Create/Edit Profile Form */}
                {showForm && (
                    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <h3 className="text-text-light dark:text-text-dark text-xl font-bold mb-4">
                            {editingProfile ? 'Edit Profile' : 'Create New Profile'}
                        </h3>
                        
                        {formError && (
                            <div className="mb-4 p-3 bg-negative/10 border border-negative rounded-lg">
                                <p className="text-negative text-sm">{formError}</p>
                            </div>
                        )}

                        <form onSubmit={handleCreateProfile} className="space-y-4">
                            <div>
                                <label htmlFor="profileName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                                    Profile Name
                                </label>
                                <input
                                    type="text"
                                    id="profileName"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., Personal Finances, Business Account"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="profileType" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                                    Profile Type
                                </label>
                                <select
                                    id="profileType"
                                    value={profileType}
                                    onChange={(e) => setProfileType(e.target.value)}
                                    className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="personal">Personal</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="flex-1 px-4 py-3 text-sm border border-border-light dark:border-border-dark rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    {editingProfile ? 'Update Profile' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfileSelector;