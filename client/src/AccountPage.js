import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function AccountPage({ isListView }) {
    // --- COMMON STATE ---
    const [profiles, setProfiles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- DETAIL VIEW (Transactions) STATE ---
    const { accountId } = useParams();
    const location = useLocation();
    const { accountName: initialName, accountBalance: initialBalance, profileId: initialProfileId } = location.state || {};
    
    const [transactions, setTransactions] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(initialBalance || 0);
    const [currentAccountName, setCurrentAccountName] = useState(initialName || '');

    const [txFormType, setTxFormType] = useState('expense');
    const [txFormAmount, setTxFormAmount] = useState('');
    const [txFormDescription, setTxFormDescription] = useState('');
    const [txFormCategory, setTxFormCategory] = useState('');
    const [txFormPaymentMethod, setTxFormPaymentMethod] = useState('');
    const [txFormError, setTxFormError] = useState('');


    // --- LIST VIEW (Accounts) STATE ---
    const [accounts, setAccounts] = useState([]);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [selectedProfile, setSelectedProfile] = useState('');
    const [accountFormError, setAccountFormError] = useState('');


    // --- EFFECT: FETCHING DATA BASED ON VIEW ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
        
        const fetchListData = async () => {
            try {
                const [profilesRes, accountsRes] = await Promise.all([
                    axios.get(`${API_URL}/profiles`, authHeaders),
                    axios.get(`${API_URL}/accounts`, authHeaders)
                ]);

                setProfiles(profilesRes.data);
                setAccounts(accountsRes.data);

                if (profilesRes.data.length > 0) {
                    setSelectedProfile(profilesRes.data[0].profile_id); 
                }
            } catch (err) {
                setError('Could not fetch account list data.');
            } finally {
                setLoading(false);
            }
        };

        const fetchDetailData = async () => {
            if (!accountId || !initialProfileId) { 
                setError('Missing account or profile ID. Please go back to the accounts list.');
                setLoading(false);
                return;
            }
            try {
                // Fetch the authoritative account data first
                const accountDetailRes = await axios.get(`${API_URL}/accounts/${accountId}`, authHeaders);
                const fetchedAccount = accountDetailRes.data; 

                setCurrentBalance(fetchedAccount.balance);
                setCurrentAccountName(fetchedAccount.name); 
                
                // Fetch transactions, categories, payment methods concurrently
                const [txRes, catRes, pmRes] = await Promise.all([
                    axios.get(`${API_URL}/transactions/account/${accountId}`, authHeaders),
                    axios.get(`${API_URL}/categories/profile/${initialProfileId}`, authHeaders),
                    axios.get(`${API_URL}/payment-methods`, authHeaders)
                ]);

                setTransactions(txRes.data);
                setCategories(catRes.data);
                setPaymentMethods(pmRes.data);

                if (catRes.data.length > 0) setTxFormCategory(catRes.data[0].category_id);
                if (pmRes.data.length > 0) setTxFormPaymentMethod(pmRes.data[0].payment_method_id);
            } catch (err) {
                setError('Could not fetch transaction data.');
            } finally {
                setLoading(false);
            }
        };
        
        setLoading(true);
        if (isListView) {
            fetchListData();
        } else {
            fetchDetailData();
        }

    }, [isListView, accountId, initialProfileId]); 


    // --- HANDLER: Create New Account (Used in List View) ---
    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setAccountFormError('');
        if (!newAccountName || !selectedProfile) {
            setAccountFormError('Profile and Account Name are required.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            const body = { 
                name: newAccountName, 
                balance: parseFloat(newAccountBalance) || 0.00, 
                profile_id: selectedProfile 
            };
            const response = await axios.post(`${API_URL}/accounts`, body, authHeaders);
            
            setAccounts([...accounts, response.data]); 
            setNewAccountName('');
            setNewAccountBalance('');
            
        } catch (err) {
            setAccountFormError('Failed to create account.');
        }
    };


    // --- HANDLER: Add Transaction (Used in Detail View) ---
    const handleAddTransaction = async (e) => {
        e.preventDefault();
        setTxFormError('');
        if (!txFormAmount || !txFormCategory || !txFormPaymentMethod) {
            setTxFormError('Amount, Category, and Payment Method are required.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            const body = {
                account_id: accountId,
                type: txFormType,
                amount: parseFloat(txFormAmount),
                description: txFormDescription,
                category_id: parseInt(txFormCategory, 10),
                payment_method_id: parseInt(txFormPaymentMethod, 10),
            };
            const response = await axios.post(`${API_URL}/transactions`, body, authHeaders);
            const newTransaction = response.data;
            setTransactions([newTransaction, ...transactions]);

            const newBalance = (txFormType === 'income')
                ? parseFloat(currentBalance) + parseFloat(newTransaction.amount)
                : parseFloat(currentBalance) - parseFloat(newTransaction.amount);
            setCurrentBalance(newBalance);
            setTxFormAmount('');
            setTxFormDescription('');
            setTxFormError('');
        } catch (err) {
            setTxFormError('Failed to create transaction.');
        }
    };


    // --- HANDLER: Delete Transaction (Used in Detail View) ---
    const handleDeleteTransaction = async (transactionId, amount, type) => {
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.delete(`${API_URL}/transactions/${transactionId}`, authHeaders);
            
            setTransactions(transactions.filter(tx => tx.transaction_id !== transactionId));
            
            const newBalance = (type === 'income')
                ? parseFloat(currentBalance) - parseFloat(amount)
                : parseFloat(currentBalance) + parseFloat(amount);
            setCurrentBalance(newBalance);
            
        } catch (err) {
            setTxFormError('Failed to delete transaction.');
        }
    };


    // --- RENDER: LIST VIEW (Account List/Form) ---
    const renderListView = () => {
        const renderAccountForm = () => {
            return (
                <form onSubmit={handleCreateAccount} className="flex flex-col h-full">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Add New Account</h3>
                    {accountFormError && <p className="text-negative text-sm text-center mb-4">{accountFormError}</p>}
                    
                    <div className="mb-4">
                        <label htmlFor="profileSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Add to Profile:</label>
                        <select id="profileSelect" value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                            disabled={profiles.length === 0}>
                            {profiles.length === 0 ? (<option value="">Create a profile first</option>) : (profiles.map(p => (<option key={p.profile_id} value={p.profile_id}>{p.profile_name} ({p.profile_type})</option>)))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="accountName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Account Name:</label>
                        <input id="accountName" type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                            placeholder="e.g., Checking" disabled={profiles.length === 0}/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="accountBalance" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Initial Balance: (Optional)</label>
                        <input id="accountBalance" type="number" step="0.01" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                            placeholder="0.00" disabled={profiles.length === 0}/>
                    </div>
                    <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={profiles.length === 0}>Create Account</button>
                </form>
            );
        };

        const renderAccountList = () => {
            if (accounts.length === 0) return <p className="text-text-muted-light dark:text-text-muted-dark">You haven't added any accounts yet.</p>;
            return (
                <div className="space-y-3">
                    {accounts.map(account => (
                        <Link 
                            key={account.account_id} 
                            to={`/account/${account.account_id}`} 
                            className="flex justify-between items-center p-3 bg-background-light dark:bg-background-dark hover:bg-primary/10 rounded-lg transition-colors border-l-4 border-primary"
                            state={{ accountName: account.name, accountBalance: account.balance, profileId: account.profile_id }} 
                        >
                            <span className="text-text-light dark:text-text-dark font-medium">{account.name}</span>
                            <span className="text-sm font-semibold text-positive">${parseFloat(account.balance).toFixed(2)}</span>
                        </Link>
                    ))}
                </div>
            );
        };
        
        return (
            <div className="w-full max-w-5xl mx-auto p-8">
                <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Your Accounts Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        {renderAccountForm()}
                    </div>
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        <h3 className="text-text-light dark:text-text-dark text-lg font-semibold">Existing Accounts</h3>
                        {renderAccountList()}
                    </div>
                </div>
            </div>
        );
    };


    // --- RENDER: DETAIL VIEW (Transaction Form/List) ---
    const renderDetailView = () => {
        
        const renderAddTransactionForm = () => {
            return (
                <form onSubmit={handleAddTransaction} className="flex flex-col">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Add New Transaction</h3>
                    {txFormError && <p className="text-negative text-sm text-center mb-4">{txFormError}</p>}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="txType" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Type</label>
                            <select id="txType" value={txFormType} onChange={(e) => setTxFormType(e.target.value)} 
                                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="expense">Expense</option><option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="txAmount" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Amount</label>
                            <input id="txAmount" type="number" step="0.01" value={txFormAmount} onChange={(e) => setTxFormAmount(e.target.value)} 
                                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                                placeholder="0.00"/>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="txDesc" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Description (Optional)</label>
                        <input id="txDesc" type="text" value={txFormDescription} onChange={(e) => setTxFormDescription(e.target.value)} 
                            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" 
                            placeholder="e.g., Coffee, Paycheck"/>
                    </div>
                    
                    {/* FIX: Category and Payment Method Selects */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="txCategory" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Category</label>
                            <select
                                id="txCategory"
                                value={txFormCategory}
                                onChange={(e) => setTxFormCategory(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={categories.length === 0}
                            >
                                {categories.length === 0 
                                    ? <option>No categories found</option>
                                    : categories.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.name}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <div>
                            <label htmlFor="txPaymentMethod" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Payment Method</label>
                            <select
                                id="txPaymentMethod"
                                value={txFormPaymentMethod}
                                onChange={(e) => setTxFormPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={paymentMethods.length === 0}
                            >
                                {paymentMethods.length === 0
                                    ? <option>No methods found</option>
                                    : paymentMethods.map(pm => (
                                        <option key={pm.payment_method_id} value={pm.payment_method_id}>
                                            {pm.type}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Add Transaction</button>
                </form>
            );
        };

        const renderTransactionList = () => {
            if (transactions.length === 0) return <p className="text-text-muted-light dark:text-text-muted-dark">No transactions found for this account.</p>;
            return (
                <div className="space-y-2">
                    {transactions.map(tx => (
                        <div key={tx.transaction_id} className="flex justify-between items-center p-3 hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors">
                            <div className="flex flex-col">
                                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{new Date(tx.time_stamp).toLocaleDateString()}</span>
                                <span className="text-text-light dark:text-text-dark">{tx.description || 'Transaction'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`font-semibold ${tx.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                                    {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                                </span>
                                <button onClick={() => handleDeleteTransaction(tx.transaction_id, tx.amount, tx.type)} 
                                    className="text-negative text-xl font-bold hover:text-negative/80 transition-colors" 
                                    title="Delete Transaction">&times;</button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        };
        
        return (
            <div className="w-full max-w-4xl mx-auto p-8">
                <div>
                    <h2 className="text-text-light dark:text-text-dark text-2xl font-bold text-center mb-2">{currentAccountName}</h2>
                    <h3 className="text-text-muted-light dark:text-text-muted-dark text-base text-center mb-8">Current Balance: ${parseFloat(currentBalance).toFixed(2)}</h3>
                    
                    <div className="mb-8 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        {renderAddTransactionForm()}
                    </div>
                    
                    <div>
                        <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4 pb-2 border-b border-border-light dark:border-border-dark">Transactions</h3>
                        {renderTransactionList()}
                    </div>
                </div>
            </div>
        );
    };


    // --- MAIN RENDER LOGIC ---
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading data...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    // Conditional rendering based on the prop from App.js
    return isListView ? renderListView() : renderDetailView();
}

export default AccountPage;
