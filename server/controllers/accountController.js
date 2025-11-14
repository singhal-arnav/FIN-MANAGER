const db = require('../config/db');

// NEW FUNCTION: Get all accounts for the logged-in user
const getAllUserAccounts = async (req, res) => {
    try {
        // req.user.user_id is added by the 'protect' middleware
        const userId = req.user.user_id;

        // This query finds all accounts for a user by first finding all their profiles
        // and then joining the accounts table.
        const [accounts] = await db.query(
            'SELECT a.* FROM Accounts a ' +
            'JOIN Profiles p ON a.profile_id = p.profile_id ' +
            'WHERE p.user_id = ?',
            [userId]
        );

        res.status(200).json(accounts);
    } catch (error) {
        console.error('Error fetching all user accounts:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// --- EXISTING FUNCTIONS ---

const getAccountsByProfile = async (req, res) => {
    try {
        const profileId = req.params.profileId;

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view these accounts' });
        }
        
        const [accounts] = await db.query('SELECT * FROM Accounts WHERE profile_id = ?', [profileId]);
        res.status(200).json(accounts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createAccount = async (req, res) => {
    try {
        const { profile_id, name, balance } = req.body;

        if (!profile_id || !name) {
            return res.status(400).json({ message: 'Profile ID and account name are required' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to add an account to this profile' });
        }

        const [newAccount] = await db.query(
            'INSERT INTO Accounts (profile_id, name, balance) VALUES (?, ?, ?)',
            [profile_id, name, balance || 0.00]
        );
        
        const [createdAccount] = await db.query('SELECT * FROM Accounts WHERE account_id = ?', [newAccount.insertId]);

        res.status(201).json(createdAccount[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateAccount = async (req, res) => {
    try {
        const accountId = req.params.id;
        const { name, balance } = req.body;

        const [accounts] = await db.query('SELECT * FROM Accounts WHERE account_id = ?', [accountId]);
        const account = accounts[0];

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [account.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to update this account' });
        }
        
        await db.query(
            'UPDATE Accounts SET name = ?, balance = ? WHERE account_id = ?',
            [name || account.name, balance || account.balance, accountId]
        );

        const [updatedAccount] = await db.query('SELECT * FROM Accounts WHERE account_id = ?', [accountId]);
        
        res.status(200).json(updatedAccount[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const accountId = req.params.id;

        const [accounts] = await db.query('SELECT * FROM Accounts WHERE account_id = ?', [accountId]);
        const account = accounts[0];

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [account.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to delete this account' });
        }

        await db.query('DELETE FROM Accounts WHERE account_id = ?', [accountId]);
        
        res.status(200).json({ message: `Account with id ${accountId} deleted successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAccountDetails = async (req, res) => {
    try {
        const accountId = req.params.id; // Correctly pull the ID from the URL parameter

        const [accounts] = await db.query('SELECT * FROM Accounts WHERE account_id = ?', [accountId]);
        const account = accounts[0];

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        
        // Authorization check (crucial security step):
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [account.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view this account' });
        }

        // Send back the full account object, including the up-to-date balance
        res.status(200).json(account); 
    } catch (error) {
        console.error('Error fetching account details:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getTotalNetWorth = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // This query sums all balances across all accounts owned by the user's profiles
        const [result] = await db.query(
            'SELECT SUM(A.balance) AS net_worth FROM Accounts A ' +
            'JOIN Profiles P ON A.profile_id = P.profile_id ' +
            'WHERE P.user_id = ?', 
            [userId]
        );
        
        // Ensure net_worth is a number, defaulting to 0 if null
        const netWorth = result[0]?.net_worth || 0; 
        
        res.status(200).json({ net_worth: parseFloat(netWorth) });
    } catch (error) {
        console.error('Error fetching total net worth:', error);
        res.status(500).json({ message: 'Server Error during Net Worth calculation' });
    }
};

const getHistoricalNetWorth = async (req, res) => {
    try {
        const { profileId } = req.params;
        const days = parseInt(req.query.days) || 30; // Default to last 30 days

        // Verify the profile belongs to the logged-in user
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view net worth for this profile' });
        }

        // Get all accounts for this profile
        const [accounts] = await db.query('SELECT account_id, balance FROM Accounts WHERE profile_id = ?', [profileId]);
        
        // Get all transactions for this profile, ordered by date
        const [transactions] = await db.query(
            'SELECT T.account_id, T.type, T.amount, DATE(T.time_stamp) as date ' +
            'FROM Transactions T ' +
            'JOIN Accounts A ON T.account_id = A.account_id ' +
            'WHERE A.profile_id = ? ' +
            'ORDER BY T.time_stamp ASC',
            [profileId]
        );

        // Calculate date range
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Initialize account balances (current balances - we'll work backwards)
        const accountBalances = {};
        accounts.forEach(acc => {
            accountBalances[acc.account_id] = parseFloat(acc.balance) || 0;
        });

        // Group transactions by date
        // MySQL DATE() returns 'YYYY-MM-DD' format, use it directly as key
        const transactionsByDate = {};
        transactions.forEach(tx => {
            // tx.date is already in 'YYYY-MM-DD' format from MySQL DATE() function
            const dateKey = tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : String(tx.date).split('T')[0];
            const txDate = new Date(dateKey + 'T00:00:00'); // Create date at midnight to avoid timezone issues
            if (txDate >= startDate && txDate <= endDate) {
                if (!transactionsByDate[dateKey]) {
                    transactionsByDate[dateKey] = [];
                }
                transactionsByDate[dateKey].push(tx);
            }
        });

        // Calculate net worth for each day
        const historicalData = [];
        const dateMap = {}; // To track net worth for each date

        // Work backwards from end date to calculate historical balances
        // First, reverse apply all transactions to get starting balances
        const reversedTransactions = [...transactions].reverse();
        const startingBalances = { ...accountBalances };
        
        reversedTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate < startDate) {
                // Reverse apply transactions before our date range
                if (tx.type === 'income') {
                    startingBalances[tx.account_id] -= parseFloat(tx.amount);
                } else {
                    startingBalances[tx.account_id] += parseFloat(tx.amount);
                }
            }
        });

        // Now calculate net worth for each day forward
        let currentBalances = { ...startingBalances };
        
        // Generate all dates in range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            
            // Apply transactions for this date
            if (transactionsByDate[dateKey]) {
                transactionsByDate[dateKey].forEach(tx => {
                    if (tx.type === 'income') {
                        currentBalances[tx.account_id] = (currentBalances[tx.account_id] || 0) + parseFloat(tx.amount);
                    } else {
                        currentBalances[tx.account_id] = (currentBalances[tx.account_id] || 0) - parseFloat(tx.amount);
                    }
                });
            }
            
            // Calculate net worth for this date
            const netWorth = Object.values(currentBalances).reduce((sum, balance) => sum + (parseFloat(balance) || 0), 0);
            dateMap[dateKey] = netWorth;
        }

        // Convert to array format for chart
        // Simply use all dates from dateMap which already has net worth for each day
        const dataPoints = [];
        
        // For 30 days or less, include every single day
        // For more days, sample but ensure we capture all changes
        const step = days <= 30 ? 1 : Math.max(1, Math.floor(days / 60));
        
        // Iterate through every day and get net worth from dateMap
        let lastNetWorth = Object.values(startingBalances).reduce((sum, balance) => sum + (parseFloat(balance) || 0), 0);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + step)) {
            const dateKey = d.toISOString().split('T')[0];
            
            // Get net worth for this date from dateMap (should always exist since we calculated it)
            let netWorth = dateMap[dateKey];
            
            // If somehow not in dateMap (shouldn't happen), use the last known net worth
            if (netWorth === undefined) {
                netWorth = lastNetWorth;
            } else {
                lastNetWorth = netWorth; // Update last known net worth
            }
            
            dataPoints.push({
                date: dateKey,
                netWorth: parseFloat(netWorth.toFixed(2)),
                label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
        
        // Debug: Log first few and last few data points to verify variation
        if (dataPoints.length > 0) {
            console.log('Net Worth History Sample:', {
                first: dataPoints[0],
                mid: dataPoints[Math.floor(dataPoints.length / 2)],
                last: dataPoints[dataPoints.length - 1],
                uniqueValues: [...new Set(dataPoints.map(d => d.netWorth))].length
            });
        }

        // Ensure today's data point uses actual current account balances for consistency
        // Update today's net worth to match the Dashboard header (actual balances, not calculated)
        const todayKey = endDate.toISOString().split('T')[0];
        const actualTodayNetWorth = Object.values(accountBalances).reduce((sum, balance) => sum + (parseFloat(balance) || 0), 0);
        
        // Find and update today's data point if it exists (should exist from the loop above)
        const todayIndex = dataPoints.findIndex(dp => dp.date === todayKey);
        if (todayIndex !== -1) {
            // Update existing today's data point to use actual current account balances
            dataPoints[todayIndex].netWorth = parseFloat(actualTodayNetWorth.toFixed(2));
            dateMap[todayKey] = actualTodayNetWorth;
        } else {
            // If somehow today wasn't included (shouldn't happen), add it
            dataPoints.push({
                date: todayKey,
                netWorth: parseFloat(actualTodayNetWorth.toFixed(2)),
                label: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }

        // Sort by date (in case today was added at the end)
        dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json(dataPoints);
    } catch (error) {
        console.error('Error fetching historical net worth:', error);
        res.status(500).json({ message: 'Server Error during Historical Net Worth calculation' });
    }
};

module.exports = {
    getAllUserAccounts, // We've added the new function
    getAccountsByProfile,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountDetails,
    getTotalNetWorth,
    getHistoricalNetWorth,
};

