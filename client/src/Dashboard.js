import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function Dashboard({ userEmail, selectedProfile }) {
    const [accounts, setAccounts] = useState([]);
    const [netWorth, setNetWorth] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
                if (!selectedProfile?.profile_id) {
                    setError('No profile selected.');
                    setLoading(false);
                    return;
                }

                const profileId = selectedProfile.profile_id;

                const [accountsRes, transactionsRes, categoriesRes] = await Promise.all([
                    axios.get(`${API_URL}/accounts/profile/${profileId}`, authHeaders),
                    axios.get(`${API_URL}/transactions/profile/${profileId}?limit=5`, authHeaders),
                    axios.get(`${API_URL}/categories/profile/${profileId}`, authHeaders)
                ]);

                const fetchedAccounts = accountsRes.data || [];
                setAccounts(fetchedAccounts);
                const computedNetWorth = fetchedAccounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
                setNetWorth(computedNetWorth);
                setRecentTransactions(transactionsRes.data || []);
                setCategories(categoriesRes.data || []);

                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;
                try {
                    const budgetsRes = await axios.get(
                        `${API_URL}/budgets/profile/${profileId}/${currentYear}/${currentMonth}`,
                        authHeaders
                    );
                    setBudgets(budgetsRes.data || []);
                } catch (budgetErr) {
                    setBudgets([]);
                }
            } catch (err) {
                setError('Could not fetch dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [selectedProfile]);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading dashboard...</div>
        </div>
    );
    
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );
    
    // Calculate spending by category
    const categorySpending = {};
    recentTransactions.forEach(tx => {
        if (tx.type === 'expense' && tx.category_name) {
            categorySpending[tx.category_name] = (categorySpending[tx.category_name] || 0) + parseFloat(tx.amount);
        }
    });
    
    const totalSpent = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);
    const categoryPercentage = Object.entries(categorySpending).map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);
    
    // Icon mapping for categories
    const getCategoryIcon = (categoryName) => {
        if (!categoryName) return 'category';
        const name = categoryName.toLowerCase();
        if (name.includes('grocer') || name.includes('food')) return 'shopping_cart';
        if (name.includes('gas') || name.includes('transport') || name.includes('fuel')) return 'local_gas_station';
        if (name.includes('restaurant') || name.includes('dining') || name.includes('eat')) return 'restaurant';
        if (name.includes('income') || name.includes('salary') || name.includes('paycheck')) return 'work';
        return 'shopping_cart';
    };
    
    return (
        <div className="flex-1 p-8">
            {/* PageHeading & Actions */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex min-w-72 flex-col gap-1">
                    <p className="text-text-light dark:text-text-dark text-4xl font-black">Dashboard</p>
                    <p className="text-text-muted-light dark:text-text-muted-dark text-base font-normal">Here's a summary of your financial health.</p>
                </div>
                <Link 
                    to="/accounts"
                    className="flex min-w-[84px] items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold gap-2 hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span className="truncate">Add Transaction</span>
                </Link>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2 - Main Content */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Net Worth Card */}
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-text-light dark:text-text-dark text-base font-medium">Total Net Worth</p>
                                <p className="text-text-light dark:text-text-dark text-4xl font-bold mt-1">
                                    ₹{netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="flex gap-1 items-center">
                                <p className="text-positive text-base font-medium">+0.0%</p>
                                <span className="material-symbols-outlined text-positive text-xl">trending_up</span>
                            </div>
                        </div>
                        {/* Simple bar chart showing account balances */}
                        <div className="flex min-h-[180px] flex-1 flex-col justify-end mt-4">
                            {accounts.length > 0 ? (
                                <div className="flex items-end gap-2 h-full">
                                    {accounts.slice(0, 8).map(account => {
                                        const accountBalance = parseFloat(account.balance) || 0;
                                        const balances = accounts.map(a => Math.abs(parseFloat(a.balance) || 0));
                                        const maxBalance = Math.max(...balances);
                                        const height = maxBalance > 0 ? (Math.abs(accountBalance) / maxBalance) * 100 : 0;
                                        return (
                                            <div key={account.account_id} className="flex-1 flex flex-col items-center">
                                                <div 
                                                    className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80"
                                                    style={{ height: `${height}%` }}
                                                    title={`${account.name}: ₹${accountBalance.toFixed(2)}`}
                                                ></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-text-muted-light dark:text-text-muted-dark text-sm text-center py-8">
                                    Add accounts to see a visual breakdown
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        <div className="flex justify-between items-center">
                            <h3 className="text-text-light dark:text-text-dark text-lg font-bold">Recent Transactions</h3>
                            <Link to="/accounts" className="text-primary text-sm font-bold hover:underline">View All</Link>
                        </div>
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                                    No transactions yet
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
                                {recentTransactions.map(tx => (
                                    <div key={tx.transaction_id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary">
                                                <span className="material-symbols-outlined">
                                                    {getCategoryIcon(tx.category_name)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-text-light dark:text-text-dark font-medium">
                                                    {tx.description || 'Transaction'}
                                                </p>
                                                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                                                    {tx.category_name || 'Uncategorized'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${tx.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                                                {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                                            </p>
                                            <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                                                {new Date(tx.time_stamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3 - Sidebar Info */}
                <div className="flex flex-col gap-6">
                    {/* Accounts Summary */}
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        <div className="flex justify-between items-center">
                            <h3 className="text-text-light dark:text-text-dark text-lg font-bold">My Accounts</h3>
                            <Link to="/accounts" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                <span className="material-symbols-outlined text-base">add_circle</span> Add New
                            </Link>
                        </div>
                        {accounts.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                                    No accounts yet
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {accounts.slice(0, 3).map(account => (
                                    <div key={account.account_id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                                                <span className="material-symbols-outlined text-primary text-sm">
                                                    account_balance_wallet
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-text-light dark:text-text-dark font-medium">{account.name}</p>
                                                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">... {account.account_id}</p>
                                            </div>
                                        </div>
                                        <p className={`font-semibold ${
                                            account.balance >= 0 
                                                ? 'text-text-light dark:text-text-dark' 
                                                : 'text-negative'
                                        }`}>
                                            ₹{Math.abs(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Spending by Category */}
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        <h3 className="text-text-light dark:text-text-dark text-lg font-bold">Spending by Category</h3>
                        {categoryPercentage.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                                    No spending data yet
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-center py-4">
                                    <div className="relative size-40">
                                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                            {categoryPercentage.map((cat, idx) => {
                                                const colors = ['#4A90E2', '#50E3C2', '#E35050', '#f0a830', '#9b59b6'];
                                                const offset = categoryPercentage.slice(0, idx).reduce((sum, c) => sum + (c.percentage / 100) * 100, 0);
                                                return (
                                                    <circle
                                                        key={cat.name}
                                                        cx="18"
                                                        cy="18"
                                                        r="15.9155"
                                                        fill="none"
                                                        stroke={colors[idx % colors.length]}
                                                        strokeWidth="3"
                                                        strokeDasharray={`${cat.percentage}, 100`}
                                                        strokeDashoffset={-offset}
                                                    />
                                                );
                                            })}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-text-muted-light dark:text-text-muted-dark text-sm">Total Spent</p>
                                            <p className="text-text-light dark:text-text-dark text-xl font-bold">
                                                ₹{totalSpent.toFixed(0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    {categoryPercentage.slice(0, 4).map((cat, idx) => {
                                        const colors = ['#4A90E2', '#50E3C2', '#E35050', '#f0a830'];
                                        return (
                                            <div key={cat.name} className="flex items-center gap-2">
                                                <span className="size-2 rounded-full" style={{backgroundColor: colors[idx % colors.length]}}></span>
                                                <span className="text-text-light dark:text-text-dark">{cat.name} ({cat.percentage.toFixed(0)}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Budget Progress */}
                    <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                        <h3 className="text-text-light dark:text-text-dark text-lg font-bold">Budget Progress</h3>
                        {budgets.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                                    No budgets set for this month
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {budgets.slice(0, 3).map(budget => {
                                    const spent = parseFloat(budget.spent_amount || 0);
                                    const limit = parseFloat(budget.budget);
                                    const progress = limit > 0 ? (spent / limit) * 100 : 0;
                                    const isExceeded = spent > limit;
                                    const category = categories.find(c => c.category_id === budget.category_id);
                                    
                                    return (
                                        <div key={budget.budget_id}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <p className="font-medium text-text-light dark:text-text-dark">{category?.name || 'Unknown'}</p>
                                                <p className="text-text-muted-light dark:text-text-muted-dark">
                                                    ₹{spent.toFixed(0)} / ₹{limit.toFixed(0)}
                                                </p>
                                            </div>
                                            <div className="w-full bg-background-light dark:bg-background-dark rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all ${isExceeded ? 'bg-negative' : 'bg-primary'}`}
                                                    style={{width: `${Math.min(progress, 100)}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;