import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function InvestmentsPage({ selectedProfile }) {
    const [investments, setInvestments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
    const [viewMode, setViewMode] = useState('transactions'); // 👈 NEW: 'transactions' or 'assets'

    // Form state (New Investment)
    const [assetName, setAssetName] = useState('');
    const [assetType, setAssetType] = useState('');
    const [assetFormError, setAssetFormError] = useState('');

    // Form state (New Transaction)
    const [txType, setTxType] = useState('Buy');
    const [txAccountId, setTxAccountId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [txDate, setTxDate] = useState('');
    const [txFormError, setTxFormError] = useState('');


    // --- Fetch Transactions (Shared Logic - Memoized) ---
    const fetchTransactions = useCallback(async (investmentId, token) => {
        if (!investmentId) return;
        try {
            setLoading(true);
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };

            const txRes = await axios.get(
                `${API_URL}/investment-transactions/${investmentId}`, 
                authHeaders
            );
            
            setTransactions(txRes.data);
        } catch (err) {
            setError('Could not load investment transactions.');
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setTransactions]); 


    // --- Fetch Accounts ---
    const fetchAccounts = useCallback(async (profileId, token) => {
        if (!profileId) return;
        try {
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };
            const accountsRes = await axios.get(`${API_URL}/accounts/profile/${profileId}`, authHeaders);
            setAccounts(accountsRes.data || []);
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        }
    }, []);

    // --- Fetch Investments (Shared Logic - Memoized) ---
    const fetchInvestments = useCallback(async (profileId, token) => {
        try {
            setLoading(true);
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };
            
            const investmentsRes = await axios.get(
                `${API_URL}/investments/profile/${profileId}`, 
                authHeaders
            );
            
            setInvestments(investmentsRes.data);
            
            if (investmentsRes.data.length > 0) {
                const defaultInvId = investmentsRes.data[0].investment_id;
                setSelectedInvestmentId(defaultInvId);
                fetchTransactions(defaultInvId, token); 
            } else {
                 setTransactions([]);
                 setSelectedInvestmentId(null);
            }

        } catch (err) {
            setError('Could not load investments for this profile.');
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setInvestments, setSelectedInvestmentId, setTransactions, fetchTransactions]); 


    // --- Initial Data Fetching ---
    useEffect(() => {
        if (!selectedProfile?.profile_id) {
            setError('No profile selected. Please select a profile.');
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                fetchInvestments(selectedProfile.profile_id, token);
                fetchAccounts(selectedProfile.profile_id, token);
            } catch (err) {
                setError('Failed to fetch initial data.');
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [selectedProfile, fetchInvestments, fetchAccounts]);
    
    // --- Rerun fetch transactions when selectedInvestmentId changes ---
    useEffect(() => {
        if (selectedInvestmentId) {
            fetchTransactions(selectedInvestmentId);
        }
    }, [selectedInvestmentId, fetchTransactions]);


    // --- Investment Handlers ---
    const handleCreateInvestment = async (e) => {
        e.preventDefault();
        setAssetFormError('');

        if (!selectedProfile?.profile_id || !assetName) {
            setAssetFormError('Investment name is required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const body = { profile_id: selectedProfile.profile_id, investment_name: assetName, investment_type: assetType || 'Stock' };

            // 🎯 API: POST /api/investments
            await axios.post(`${API_URL}/investments`, body, authHeaders);
            
            await fetchInvestments(selectedProfile.profile_id, token);
            setAssetName('');
            setAssetType('');

            // Switch to transaction view after creation
            setViewMode('transactions'); 

        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create investment.';
            setAssetFormError(message);
        }
    };
    
    // --- Transaction Handler ---
    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        setTxFormError('');

        if (!selectedInvestmentId || !txAccountId || !quantity || !price || !txDate) {
            setTxFormError('All fields including account are required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const body = {
                investment_id: selectedInvestmentId,
                account_id: parseInt(txAccountId, 10),
                transaction_type: txType,
                quantity: parseFloat(quantity),
                price_per_unit: parseFloat(price),
                transaction_date: txDate,
            };

            // 🎯 API: POST /api/investment-transactions
            const response = await axios.post(`${API_URL}/investment-transactions`, body, authHeaders);
            
            setTransactions([response.data, ...transactions]);
            
            setQuantity('');
            setPrice('');
            setTxDate('');
            setTxAccountId('');

            // Dispatch event to refresh dashboard
            window.dispatchEvent(new CustomEvent('transactionUpdated'));

        } catch (err) {
            const message = err.response?.data?.message || 'Failed to record transaction.';
            setTxFormError(message);
        }
    };


    // --- RENDER SECTIONS ---

    const renderAssetForm = () => { 
        if (!selectedProfile) {
            return <p className="text-negative text-sm text-center mb-4">Please select a profile first.</p>;
        }
        return (
            <form onSubmit={handleCreateInvestment} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Add New Investment Asset</h3>
                {assetFormError && <p className="text-negative text-sm text-center mb-4">{assetFormError}</p>}
                
                <div className="mb-4">
                    <label htmlFor="invName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Asset Name:</label>
                    <input id="invName" type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., VTSAX, Apple Stock" required />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="invType" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Asset Type:</label>
                    <input id="invType" type="text" value={assetType} onChange={(e) => setAssetType(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., Stock, Crypto, Fund" />
                </div>
                
                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Create Asset</button>
            </form>
        );
    };
    
    const renderInvestmentList = () => {
        if (investments.length === 0) return <p className="text-text-muted-light dark:text-text-muted-dark">No assets created yet.</p>;

        return (
            <div className="flex-grow mt-4">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Your Investment Holdings</h3>
                <div className="max-h-[300px] overflow-y-auto">
                    {investments.map(inv => (
                        <div 
                            key={inv.investment_id} 
                            onClick={() => setSelectedInvestmentId(inv.investment_id)}
                            className={`px-3 py-2 mb-1 border-b border-border-light dark:border-border-dark cursor-pointer transition-all border-l-4 mb-2 text-sm ${
                                inv.investment_id === selectedInvestmentId 
                                    ? 'bg-primary/20 font-bold border-l-primary' 
                                    : 'hover:bg-background-light dark:hover:bg-background-dark border-l-transparent'
                            }`}
                        >
                            {inv.investment_name} ({inv.investment_type || 'General'})
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTransactionForm = () => { 
        if (investments.length === 0) {
            return <p className="text-text-muted-light dark:text-text-muted-dark">Create an investment asset first (e.g., "Tesla Stock") to record transactions.</p>;
        }
        return (
            <form onSubmit={handleCreateTransaction} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Record Buy / Sell</h3>
                {txFormError && <p className="text-negative text-sm text-center mb-4">{txFormError}</p>}
                
                <div className="mb-4">
                    <label htmlFor="invSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Asset:</label>
                    <select id="invSelect" value={selectedInvestmentId || ''} onChange={(e) => setSelectedInvestmentId(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                        {investments.map(inv => (
                            <option key={inv.investment_id} value={inv.investment_id}>
                                {inv.investment_name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="txAccount" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Account:</label>
                    <select id="txAccount" value={txAccountId || ''} onChange={(e) => setTxAccountId(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Select an account</option>
                        {accounts.map(acc => (
                            <option key={acc.account_id} value={acc.account_id}>
                                {acc.name} - ₹{parseFloat(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="txType" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Type:</label>
                        <select id="txType" value={txType} onChange={(e) => setTxType(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="Buy">Buy</option>
                            <option value="Sell">Sell</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Quantity:</label>
                        <input id="quantity" type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Price/Unit (₹):</label>
                        <input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                        <label htmlFor="txDate" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Date:</label>
                        <input id="txDate" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                </div>

                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Record Transaction</button>
            </form>
        );
    };

    const renderTransactionList = () => {
        const currentInvestment = investments.find(inv => inv.investment_id === selectedInvestmentId);
        
        if (!currentInvestment) return <p className="text-text-muted-light dark:text-text-muted-dark">Select an investment to see its transactions.</p>;
        if (transactions.length === 0) return <p className="text-text-muted-light dark:text-text-muted-dark">No transactions recorded for {currentInvestment.investment_name}.</p>;
        
        return (
            <div className="space-y-2">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">History for {currentInvestment.investment_name}</h3>
                {transactions.map(tx => (
                    <div key={tx.inv_transaction_id} className="flex justify-between items-center px-3 py-3 border-b border-border-light dark:border-border-dark rounded transition-colors border-l-4 mb-2" style={{borderLeftColor: tx.transaction_type === 'Buy' ? '#50E3C2' : '#E35050'}}>
                        <div className="flex flex-col flex-grow">
                            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{new Date(tx.transaction_date).toLocaleDateString()}</span>
                            <span className="text-text-light dark:text-text-dark text-base">{tx.transaction_type} {parseFloat(tx.quantity).toFixed(4)} units @ ₹{parseFloat(tx.price_per_unit).toFixed(2)}</span>
                        </div>
                        <div className="ml-4 text-right">
                            <span className="font-bold text-text-light dark:text-text-dark">₹{(parseFloat(tx.quantity) * parseFloat(tx.price_per_unit)).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };


    // --- Main Render ---
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading Investment Data...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Investment Tracker</h2>

            <div className="flex items-center gap-4 mb-8">
                {/* Tab Switcher */}
                <div className="flex gap-1 ml-auto">
                    <button 
                        onClick={() => setViewMode('transactions')} 
                        className={`h-8 px-3 text-sm font-medium rounded-lg transition-colors ${
                            viewMode === 'transactions' 
                                ? 'bg-primary text-white' 
                                : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-primary/20'
                        }`}
                    >
                        Record & Track
                    </button>
                    <button 
                        onClick={() => setViewMode('assets')} 
                        className={`h-8 px-3 text-sm font-medium rounded-lg transition-colors ${
                            viewMode === 'assets' 
                                ? 'bg-primary text-white' 
                                : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-primary/20'
                        }`}
                    >
                        Add New Asset
                    </button>
                </div>
            </div>

            {/* Conditional Rendering based on viewMode */}
            {viewMode === 'assets' ? (
                // View 1: Asset Creation/Management
                <div className="grid grid-cols-1 md:grid-cols-1 justify-center max-w-2xl mx-auto mb-8">
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        {renderAssetForm()}
                        {renderInvestmentList()}
                    </div>
                </div>
            ) : (
                // View 2: Transaction Entry / History
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Left Column: Asset List */}
                        <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                            {renderInvestmentList()}
                        </div>
                        
                        {/* Right Column: Transaction Form */}
                        <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                            {renderTransactionForm()}
                        </div>
                    </div>
                    {/* Bottom Row: Transaction List */}
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        {renderTransactionList()}
                    </div>
                </>
            )}
        </div>
    );
}

export default InvestmentsPage;