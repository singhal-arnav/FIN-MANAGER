import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function GoalsPage({ selectedProfile }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Goal Form state
    const [goalName, setGoalName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState(''); 
    const [formError, setFormError] = useState('');

    // 👇 NEW STATE FOR CONTRIBUTION INPUT
    const [contributionAmount, setContributionAmount] = useState({}); // {goalId: amount} 

    // --- Fetch Goals based on profile filter (Shared logic) ---
    const fetchGoals = async (profileId, token) => {
        if (!profileId) return;

        try {
            setLoading(true);
            setError(''); 
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };

            const goalsRes = await axios.get(
                `${API_URL}/financial-goals/profile/${profileId}`, 
                authHeaders
            );
            
            setGoals(goalsRes.data);

        } catch (err) {
            setError('Could not load goals for this profile.');
        } finally {
            setLoading(false);
        }
    };

    // --- Initial Data Fetching ---
    useEffect(() => {
        if (!selectedProfile?.profile_id) {
            setError('No profile selected. Please select a profile.');
            setLoading(false);
            return;
        }

        const fetchRequiredData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token'); 
                await fetchGoals(selectedProfile.profile_id, token); 
            } catch (err) {
                setError('Failed to fetch goals.'); 
                setLoading(false);
            }
        };

        fetchRequiredData();
    }, [selectedProfile]);

    // --- Goal Handlers ---

    // 👇 NEW HANDLER TO UPDATE GOAL AMOUNT (Contribution)
    const handleContribute = async (goalId, currentSavedAmount) => {
        const amountToAdd = parseFloat(contributionAmount[goalId]) || 0;
        setFormError('');

        if (amountToAdd <= 0) {
            setFormError('Please enter a valid amount to contribute.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const newAmount = currentSavedAmount + amountToAdd;
            
            // Connects to: PUT /api/financialGoals/:id (Updates current_amount)
            await axios.put(`${API_URL}/financial-goals/${goalId}`, {
                // Ensure the backend updateGoal controller accepts 'current_amount' in the body
                current_amount: newAmount, 
            }, authHeaders);
            
            // Update local state instantly:
            setGoals(goals.map(g => 
                g.goal_id === goalId 
                    ? { ...g, current_amount: newAmount } 
                    : g
            ));

            // Clear input for that specific goal
            setContributionAmount(prev => {
                const newState = { ...prev };
                delete newState[goalId];
                return newState;
            });
            
        } catch (err) {
            setFormError('Failed to record contribution.');
        }
    };
    // 👆 END NEW HANDLER

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!selectedProfile?.profile_id || !goalName || !targetAmount || isNaN(parseFloat(targetAmount))) {
            setFormError('Goal Name and Target Amount are required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const sanitizedTargetDate = targetDate.trim() === '' ? null : targetDate;
            
            const body = {
                profile_id: selectedProfile.profile_id,
                goal_name: goalName,
                target_amount: parseFloat(targetAmount),
                target_date: sanitizedTargetDate, 
            };

            const response = await axios.post(`${API_URL}/financial-goals`, body, authHeaders); 
            
            if (response.data.profile_id === selectedProfile.profile_id) {
                setGoals([...goals, response.data]);
            }
            setGoalName('');
            setTargetAmount('');
            setTargetDate('');
            
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create goal.';
            setFormError(message);
        }
    };

    const handleDeleteGoal = async (goalId) => {
        if (!window.confirm("Are you sure you want to delete this goal?")) return;

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            // Corrected DELETE path: /api/financial-goals/:id
            await axios.delete(`${API_URL}/financial-goals/${goalId}`, authHeaders);
            
            setGoals(goals.filter(g => g.goal_id !== goalId));

        } catch (err) {
            setFormError('Failed to delete goal.');
        }
    };

    // --- Render Functions ---
    const renderGoalForm = () => {
        if (!selectedProfile) {
            return <p className="text-negative text-sm text-center mb-4">Please select a profile to set goals.</p>;
        }
        return (
            <form onSubmit={handleCreateGoal} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Set New Financial Goal</h3>
                {formError && <p className="text-negative text-sm text-center mb-4">{formError}</p>}
                
                <div className="mb-4">
                    <label htmlFor="goalName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Goal Name:</label>
                    <input id="goalName" type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., Down Payment, New Car Fund" required />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="targetAmount" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Target Amount (₹):</label>
                    <input id="targetAmount" type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="10000.00" required />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="targetDate" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Target Date (Optional):</label>
                    <input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                
                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Create Goal</button>
            </form>
        );
    };

    const renderGoalList = () => {
        if (goals.length === 0) {
            return <p className="text-text-muted-light dark:text-text-muted-dark">No goals set up for the selected profile.</p>;
        }
        return (
            <div className="space-y-3">
                {goals.map(goal => {
                    const saved = parseFloat(goal.current_amount || 0);
                    const target = parseFloat(goal.target_amount);
                    const progress = target > 0 ? (saved / target) * 100 : 0;
                    const statusColor = goal.status === 'Achieved' ? '#50E3C2' : goal.status === 'Cancelled' ? '#6c757d' : '#4A90E2';
                    const isAchieved = saved >= target;

                    return (
                        <div key={goal.goal_id} className="flex justify-between items-start p-3 bg-background-light dark:bg-background-dark rounded-lg border-l-4 transition-colors" style={{borderLeftColor: statusColor}}>
                            <div className="flex flex-col flex-1 min-w-0 mr-3">
                                <span className="text-text-light dark:text-text-dark font-semibold text-base">{goal.goal_name}</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark text-xs">Target: {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            
                            <div className="flex flex-col flex-2 max-w-xs w-full">
                                {/* Progress Bar */}
                                <div className="w-full h-2 bg-background-light dark:bg-background-dark rounded-full overflow-hidden mb-1">
                                    <div 
                                        className="h-full transition-all duration-500 rounded-full" 
                                        style={{width: `${Math.min(progress, 100)}%`, backgroundColor: statusColor}}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs font-medium mb-2">
                                    <span style={{color: statusColor}}>{Math.min(progress, 100).toFixed(1)}% Saved</span>
                                    <span className="text-text-muted-light dark:text-text-muted-dark">₹{saved.toFixed(2)} / ₹{target.toFixed(2)}</span>
                                </div>

                                {/* CONTRIBUTION FORM */}
                                {!isAchieved && (
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Amount to Save"
                                            value={contributionAmount[goal.goal_id] || ''}
                                            onChange={(e) => setContributionAmount({ ...contributionAmount, [goal.goal_id]: e.target.value })}
                                            className="flex-1 px-2 py-1 text-xs border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <button 
                                            onClick={() => handleContribute(goal.goal_id, saved)}
                                            className="px-3 py-1 text-xs bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!contributionAmount[goal.goal_id]}
                                        >
                                            Contribute
                                        </button>
                                    </div>
                                )}

                            </div>

                            <button onClick={() => handleDeleteGoal(goal.goal_id)} className="ml-2 text-negative text-xl font-bold hover:text-negative/80 transition-colors">&times;</button>
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Main Render ---
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading Goals...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Financial Goals Tracker</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Goal Creation Form */}
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {renderGoalForm()}
                </div>

                {/* Existing Goals List */}
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-semibold">Goals for {selectedProfile?.profile_name || 'Selected Profile'}</h3>
                    {renderGoalList()}
                </div>
            </div>
        </div>
    );
}

export default GoalsPage;