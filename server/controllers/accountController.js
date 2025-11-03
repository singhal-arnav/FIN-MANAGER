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

module.exports = {
    getAllUserAccounts, // We've added the new function
    getAccountsByProfile,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountDetails,
    getTotalNetWorth,
};

