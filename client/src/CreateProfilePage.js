import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function CreateProfilePage() {
    const navigate = useNavigate();
    const [newProfileName, setNewProfileName] = useState('');
    const [newProfileType, setNewProfileType] = useState('personal');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        if (!newProfileName) {
            setFormError('Profile Name is required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const body = {
                profile_name: newProfileName,
                profile_type: newProfileType
            };

            await axios.post(`${API_URL}/profiles`, body, authHeaders);

            setSuccessMessage('Profile created successfully! Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            setFormError('Failed to create profile. Please check your network connection.');
            console.error('Create profile error:', err);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-10 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark"> 
            <h2 className="text-text-light dark:text-text-dark text-2xl font-semibold text-center mb-8">Create New Profile</h2>
            
            {successMessage && <p className="text-positive text-sm text-center mb-4">{successMessage}</p>}
            {formError && <p className="text-negative text-sm text-center mb-4">{formError}</p>}

            <form onSubmit={handleCreateProfile} className="p-5 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
                
                <div className="mb-5">
                    <label htmlFor="profileName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Profile Name:</label>
                    <input
                        id="profileName"
                        type="text"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                        placeholder="e.g., Personal Finances"
                    />
                </div>

                <div className="mb-5">
                    <label htmlFor="profileType" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Profile Type:</label>
                    <select 
                        id="profileType"
                        value={newProfileType}
                        onChange={(e) => setNewProfileType(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    >
                        <option value="personal">Personal</option>
                        <option value="business">Business</option>
                    </select>
                </div>
                
                <button type="submit" className="w-full py-3 text-base text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                    Create Profile
                </button>
            </form>
        </div>
    );
}

export default CreateProfilePage;