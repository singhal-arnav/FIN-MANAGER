import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function CategoriesPage() {
    const [profiles, setProfiles] = useState([]); 
    const [categories, setCategories] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedProfileForCat, setSelectedProfileForCat] = useState('');
    const [categoryFormError, setCategoryFormError] = useState('');

    // --- Data Fetching: Profiles & Categories ---
    useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

                const profilesRes = await axios.get(`${API_URL}/profiles`, authHeaders);
                const fetchedProfiles = profilesRes.data;
                setProfiles(fetchedProfiles);

                if (fetchedProfiles.length > 0) {
                    const defaultProfileId = fetchedProfiles[0].profile_id;
                    setSelectedProfileForCat(defaultProfileId); 
                    
                    const categoriesRes = await axios.get(`${API_URL}/categories/profile/${defaultProfileId}`, authHeaders);
                    setCategories(categoriesRes.data);
                }

            } catch (err) {
                setError('Could not fetch category data.');
            } finally {
                setLoading(false);
            }
        };
        fetchCategoryData();
    }, []);

    const handleCategoryProfileChange = async (profileId) => {
        setSelectedProfileForCat(profileId);
        if (!profileId) {
            setCategories([]);
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            const categoriesRes = await axios.get(`${API_URL}/categories/profile/${profileId}`, authHeaders);
            setCategories(categoriesRes.data);
        } catch (err) {
            setCategoryFormError("Could not load categories for this profile.");
        } finally {
            setLoading(false);
        }
    };


    // --- Form Handler: Create Category ---
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setCategoryFormError('');
        if (!newCategoryName || !selectedProfileForCat) {
            setCategoryFormError('Profile and Category Name are required.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            const body = { name: newCategoryName, profile_id: selectedProfileForCat };
            
            const response = await axios.post(`${API_URL}/categories`, body, authHeaders);
            
            if (response.data.profile_id === selectedProfileForCat) {
                setCategories([...categories, response.data]);
            }

            setNewCategoryName('');
        } catch (err) {
            setCategoryFormError('Failed to create category.');
        }
    };


    // --- Render Functions ---
    const renderCategoryForm = () => {
        return (
            <form onSubmit={handleCreateCategory} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Create New Category</h3>
                {categoryFormError && <p className="text-negative text-sm text-center mb-4">{categoryFormError}</p>}
                
                <div className="mb-4">
                    <label htmlFor="catProfileSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">For Profile:</label>
                    <select 
                        id="catProfileSelect" 
                        value={selectedProfileForCat} 
                        onChange={(e) => handleCategoryProfileChange(e.target.value)} 
                        className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                        disabled={profiles.length === 0}
                    >
                        {profiles.length === 0 ? (
                            <option value="">Create a profile first</option>
                        ) : (
                            profiles.map(profile => (
                                <option key={profile.profile_id} value={profile.profile_id}>
                                    {profile.profile_name} ({profile.profile_type})
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="categoryName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Category Name:</label>
                    <input 
                        id="categoryName" 
                        type="text" 
                        value={newCategoryName} 
                        onChange={(e) => setNewCategoryName(e.target.value)} 
                        className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                        placeholder="e.g., Groceries, Rent" 
                        disabled={profiles.length === 0}
                    />
                </div>
                
                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={profiles.length === 0}>
                    Create Category
                </button>
            </form>
        );
    };

    const renderCategoryList = () => {
        if (categories.length === 0) {
            return <p className="text-text-muted-light dark:text-text-muted-dark">No categories found for this selected profile.</p>;
        }
        return (
            <div className="space-y-3">
                {categories.map(cat => (
                    <div key={cat.category_id} className="flex justify-between items-center p-3 bg-background-light dark:bg-background-dark rounded-lg border-l-4 border-primary">
                        <span className="text-text-light dark:text-text-dark font-medium">{cat.name}</span>
                        <span className="text-xs text-text-muted-light dark:text-text-muted-dark">Profile ID: {cat.profile_id}</span>
                    </div>
                ))}
            </div>
        );
    };
    
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading categories...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Manage Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {renderCategoryForm()}
                </div>
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-semibold">Categories for Selected Profile</h3>
                    {renderCategoryList()}
                </div>
            </div>
        </div>
    );
}

export default CategoriesPage;