import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function BudgetsPage() {
    const [budgets, setBudgets] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); 

    // State for filtering and form submission
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1); 
    const [selectedProfile, setSelectedProfile] = useState('');

    // Form state
    const [budgetAmount, setBudgetAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formError, setFormError] = useState('');

    // --- Fetch Budgets based on filters (Shared logic) ---
    const fetchBudgets = async (profileId, selectedYear, selectedMonth, token) => {
        if (!profileId) return;

        try {
            setLoading(true);
            setError(''); 
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };

            const budgetsRes = await axios.get(
                `${API_URL}/budgets/profile/${profileId}/${selectedYear}/${selectedMonth}`, 
                authHeaders
            );
            
            setBudgets(budgetsRes.data);

        } catch (err) {
            setError('Could not load budgets for this period. Check database or SQL query.');
        } finally {
            setLoading(false);
        }
    };

    // --- Data Fetching (Initial Load and Dependencies) ---
    useEffect(() => {
        const fetchRequiredData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token'); 
                const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
                
                // 1. Fetch Profiles first (to select default)
                const profilesRes = await axios.get(`${API_URL}/profiles`, authHeaders);
                const fetchedProfiles = profilesRes.data;
                setProfiles(fetchedProfiles);

                // 2. Fetch Categories (was likely causing the silent crash)
                const categoriesRes = await axios.get(`${API_URL}/categories`, authHeaders);
                const fetchedCategories = categoriesRes.data;
                setCategories(fetchedCategories);

                // 3. Set Defaults and Trigger Budget Fetch
                if (fetchedProfiles.length > 0) {
                    const defaultProfileId = fetchedProfiles[0].profile_id;
                    setSelectedProfile(defaultProfileId);
                    // Initial fetch: The effect below will handle the first budget fetch once selectedProfile is set
                }

                if (fetchedCategories.length > 0) {
                    setSelectedCategory(fetchedCategories[0].category_id);
                }

            } catch (err) {
                // This catch handles errors from Profiles or Categories fetch
                setError('Failed to fetch initial data (Profiles/Categories). Check backend endpoints.');
                setLoading(false);
            }
        };

        fetchRequiredData();
    }, []); // Only runs on mount

    // --- Data Fetching (Rerun when filters change) ---
    useEffect(() => {
        // Runs fetch when selectedProfile is set (on initial load) or changes (via filter)
        if (selectedProfile) {
            fetchBudgets(selectedProfile, year, month);
        }
    }, [selectedProfile, year, month]);


    // --- Handlers ---
    const handleCreateBudget = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!selectedProfile || !selectedCategory || !budgetAmount || isNaN(parseFloat(budgetAmount))) {
            setFormError('Please select a profile, category, and enter a valid amount.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const body = {
                profile_id: selectedProfile,
                category_id: selectedCategory,
                budget: parseFloat(budgetAmount),
                month: month,
                year: year,
            };

            const response = await axios.post(`${API_URL}/budgets`, body, authHeaders);
            
            // Re-fetch data to get the calculated spent amount
            if (response.data.profile_id === selectedProfile) {
                fetchBudgets(selectedProfile, year, month, token); 
            }
            setBudgetAmount('');
            
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create budget.';
            setFormError(message);
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        if (!window.confirm("Are you sure you want to delete this budget?")) return;

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.delete(`${API_URL}/budgets/${budgetId}`, authHeaders);
            
            setBudgets(budgets.filter(b => b.budget_id !== budgetId));

        } catch (err) {
            setFormError('Failed to delete budget.');
        }
    };

    // --- Render Functions ---
    const renderBudgetForm = () => {
        return (
            <form onSubmit={handleCreateBudget} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Set New Monthly Budget</h3>
                {formError && <p className="text-negative text-sm text-center mb-4">{formError}</p>}
                
                <div className="mb-4">
                    <label htmlFor="profileSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Profile:</label>
                    <select id="profileSelect" value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} 
                        className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                        {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                    </select>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="categorySelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Category:</label>
                    <select id="categorySelect" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} 
                        className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                        {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="budgetAmount" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Monthly Limit ($):</label>
                    <input id="budgetAmount" type="number" step="0.01" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} 
                        className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                        placeholder="500.00" />
                </div>
                
                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Set Budget</button>
            </form>
        );
    };

    const renderBudgetList = () => {
        const budgetsForSelectedProfile = budgets.filter(b => b.profile_id === selectedProfile);

        if (budgetsForSelectedProfile.length === 0) {
            return <p className="text-text-muted-light dark:text-text-muted-dark">No budgets set up for {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} under this profile.</p>;
        }
        return (
            <div className="space-y-3">
                {budgetsForSelectedProfile.map(budget => {
                    const spent = parseFloat(budget.spent_amount || 0); 
                    const limit = parseFloat(budget.budget);
                    const remaining = limit - spent;
                    
                    // 1. Calculate Progress and Status
                    const progress = limit > 0 ? (spent / limit) * 100 : 0; 
                    const isExceeded = remaining < 0;

                    // 2. Determine Color
                    const getProgressBarColor = (percentage) => {
                        if (percentage > 100) return 'bg-negative';
                        if (percentage >= 85) return 'bg-yellow-500'; // High usage (85%+)
                        return 'bg-positive'; // Normal usage
                    };

                    return (
                        <div key={budget.budget_id} className={`flex justify-between items-center p-3 rounded-lg mb-3 border-l-4 ${isExceeded ? 'bg-negative/10 border-negative' : 'bg-background-light dark:bg-background-dark border-yellow-500'}`}>
                            <span className="text-text-light dark:text-text-dark font-semibold">
                                {categories.find(c => c.category_id === budget.category_id)?.name || 'Unknown Category'}
                            </span>
                            <div className="flex flex-col items-end text-right" style={{width: '50%'}}>
                                
                                {/* 3. PROGRESS BAR JSX */}
                                <div className="w-full h-2 bg-background-light dark:bg-background-dark rounded-full overflow-hidden mb-1">
                                    <div 
                                        className={`h-full transition-all duration-500 ${getProgressBarColor(progress)}`}
                                        style={{width: `${Math.min(progress, 100)}%`}}
                                    ></div>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">Limit: ${limit.toFixed(2)} | Spent: ${spent.toFixed(2)}</span>
                                    <span className={`font-bold mt-1 flex items-center ${isExceeded ? 'text-negative' : 'text-positive'}`}>
                                        {isExceeded ? `OVERSPENT: $${Math.abs(remaining).toFixed(2)}` : `Remaining: $${remaining.toFixed(2)}`}
                                        <button onClick={() => handleDeleteBudget(budget.budget_id)} 
                                            className="ml-2 text-negative text-xl font-bold hover:text-negative/80 transition-colors">&times;</button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Main Render ---
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading Budgets...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(year, i).toLocaleString('default', { month: 'long' })
    }));

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Budget Planner</h2>
            
            {/* Filter Controls */}
            <div className="flex gap-4 mb-8 items-center">
                <select value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} 
                    className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                    {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                </select>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} 
                    className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                    {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} 
                    className="w-20 px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                    min="2020" max="2050" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Budget Creation Form */}
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {renderBudgetForm()}
                </div>

                {/* Existing Budgets List */}
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-semibold">Budgets for {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    {renderBudgetList()}
                </div>
            </div>
        </div>
    );
}

export default BudgetsPage;
