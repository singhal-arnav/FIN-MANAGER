import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function RecurringPage() {
    const [profiles, setProfiles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]); // 👈 NEW STATE
    const [recurringTxs, setRecurringTxs] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for filtering
    const [selectedProfile, setSelectedProfile] = useState('');

    // Form state (New Recurring Transaction)
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('Monthly');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState(''); // 👈 NEW STATE
    const [endDate, setEndDate] = useState('');
    const [formError, setFormError] = useState('');
    
    const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Yearly'];


    // --- Fetch Transactions (Memoized) ---
    const fetchTransactions = useCallback(async (profileId, token) => {
        if (!profileId) return;
        try {
            setLoading(true);
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };

            // 🎯 API: GET /api/recurring-transactions/profile/:profileId
            const txRes = await axios.get(
                `${API_URL}/recurring-transactions/profile/${profileId}`, 
                authHeaders
            );
            
            setRecurringTxs(txRes.data);
        } catch (err) {
            setError('Could not load recurring transactions.');
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setRecurringTxs]); 


    // --- Initial Data Fetching ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
                
                // 🎯 FIX: Fetch Accounts along with Profiles and Categories
                const [profilesRes, categoriesRes, accountsRes] = await Promise.all([
                    axios.get(`${API_URL}/profiles`, authHeaders),
                    axios.get(`${API_URL}/categories`, authHeaders),
                    axios.get(`${API_URL}/accounts`, authHeaders) // 👈 FETCH ACCOUNTS
                ]);
                
                setProfiles(profilesRes.data);
                setCategories(categoriesRes.data);
                setAccounts(accountsRes.data); // 👈 SET ACCOUNTS

                if (profilesRes.data.length > 0) {
                    const defaultProfileId = profilesRes.data[0].profile_id;
                    setSelectedProfile(defaultProfileId);
                    
                    if (categoriesRes.data.length > 0) {
                        setCategoryId(categoriesRes.data[0].category_id);
                    }
                    if (accountsRes.data.length > 0) {
                        setAccountId(accountsRes.data[0].account_id); // 👈 SET DEFAULT ACCOUNT
                    }

                    // Fetch initial transactions for the default profile
                    fetchTransactions(defaultProfileId, token);
                }

            } catch (err) {
                setError('Failed to fetch initial data (Profiles/Categories/Accounts).');
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [fetchTransactions]); 

    // --- Rerun fetch when selectedProfile changes ---
    useEffect(() => {
        if (selectedProfile) {
            fetchTransactions(selectedProfile);
            // 🎯 Optional: Filter default account to selected profile's accounts
            const profileAccounts = accounts.filter(a => a.profile_id === selectedProfile);
            if (profileAccounts.length > 0) {
                 setAccountId(profileAccounts[0].account_id);
            }
        }
    }, [selectedProfile, fetchTransactions, accounts]);


    // --- Handlers ---
    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        setFormError('');

        // 🎯 FIX: Add accountId to the required validation check
        if (!selectedProfile || !accountId || !amount || !frequency || isNaN(parseFloat(amount))) {
            setFormError('Profile, Account, Amount, and Frequency are required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            // 🎯 API: POST /api/recurring-transactions
            const body = {
                profile_id: selectedProfile,
                account_id: accountId, // 👈 SENDING THE ACCOUNT ID
                category_id: categoryId || null,
                description: description,
                amount: parseFloat(amount),
                frequency: frequency,
                end_date: endDate || null,
            };

            const response = await axios.post(`${API_URL}/recurring-transactions`, body, authHeaders);
            
            // Update local state and clear form
            setRecurringTxs([response.data, ...recurringTxs]);
            setDescription('');
            setAmount('');
            setEndDate('');

        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create recurring transaction.';
            setFormError(message);
        }
    };
    
    const handleDeleteTransaction = async (txId) => {
        if (!window.confirm("Are you sure you want to delete this recurring transaction?")) return;
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            // 🎯 API: DELETE /api/recurring-transactions/:id
            await axios.delete(`${API_URL}/recurring-transactions/${txId}`, authHeaders);
            
            setRecurringTxs(recurringTxs.filter(tx => tx.recurring_id !== txId));
        } catch (err) {
            setFormError('Failed to delete transaction.');
        }
    };


    // --- RENDER SECTIONS ---

    const renderCreationForm = () => {
        if (profiles.length === 0) {
            return <p className="text-negative text-sm text-center mb-4">Please create a Profile first.</p>;
        }
        
        // Filter accounts to show only those belonging to the selected profile
        const currentProfileAccounts = accounts.filter(a => a.profile_id === selectedProfile);

        return (
            <form onSubmit={handleCreateTransaction} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Schedule New Payment/Income</h3>
                {formError && <p className="text-negative text-sm text-center mb-4">{formError}</p>}
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="profileSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Profile:</label>
                        <select id="profileSelect" value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                            {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="accountSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Source/Destination Account:</label>
                        <select id="accountSelect" value={accountId} onChange={(e) => setAccountId(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" disabled={currentProfileAccounts.length === 0}>
                            {currentProfileAccounts.length === 0 ? (
                                <option value="">No Accounts Found</option>
                            ) : (
                                currentProfileAccounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name}</option>)
                            )}
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="desc" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Description:</label>
                    <input id="desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., Monthly Rent, Salary" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Amount ($):</label>
                        <input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Frequency:</label>
                        <select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                            {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Category (Optional):</label>
                        <select id="category" value={categoryId} onChange={(e) => setCategoryId(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" disabled={categories.length === 0}>
                            <option value="">-- Select Category --</option>
                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">End Date (Optional):</label>
                        <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                </div>

                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Schedule Transaction</button>
            </form>
        );
    };

    const renderTransactionList = () => {
        if (recurringTxs.length === 0) {
            return <p className="text-text-muted-light dark:text-text-muted-dark">No recurring transactions are currently scheduled for this profile.</p>;
        }
        return (
            <div className="space-y-2">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Scheduled Transactions</h3>
                {recurringTxs.map(tx => {
                    const category = categories.find(c => c.category_id === tx.category_id);
                    const account = accounts.find(a => a.account_id === tx.account_id);
                    
                    return (
                        <div key={tx.recurring_id} className="flex justify-between items-center px-3 py-3 border-b border-border-light dark:border-border-dark rounded transition-colors border-l-4 border-l-primary mb-2">
                            <div className="flex flex-col flex-grow">
                                <span className="text-text-light dark:text-text-dark text-base font-semibold">{tx.description || `Amount: $${tx.amount.toFixed(2)}`}</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark text-xs">
                                    {tx.frequency} | Account: {account?.name || 'N/A'} | Cat: {category?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center ml-4">
                                <span className="font-bold text-text-light dark:text-text-dark">${parseFloat(tx.amount).toFixed(2)}</span>
                                <button onClick={() => handleDeleteTransaction(tx.recurring_id)} className="ml-2 text-negative text-xl font-bold hover:text-negative/80 transition-colors">&times;</button>
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
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading Recurring Transactions...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Recurring Payments & Income</h2>

            <div className="flex items-center gap-4 mb-8">
                <label className="font-bold text-text-light dark:text-text-dark">View Profile:</label>
                <select value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                    {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {renderCreationForm()}
                </div>
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {renderTransactionList()}
                </div>
            </div>
        </div>
    );
}

export default RecurringPage;