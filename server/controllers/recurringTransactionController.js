const db = require('../config/db');

const getRecurringTransactionsByProfile = async (req, res) => {
    try {
        const profileId = req.params.profileId;
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        const [transactions] = await db.query('SELECT * FROM Recurring_Transactions WHERE profile_id = ?', [profileId]);
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createRecurringTransaction = async (req, res) => {
    try {
        const { profile_id, category_id, description, amount, frequency, end_date } = req.body;
        if (!profile_id || !amount || !frequency) {
            return res.status(400).json({ message: 'Profile ID, amount, and frequency are required' });
        }
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const [newTransaction] = await db.query(
            'INSERT INTO Recurring_Transactions (profile_id, category_id, description, amount, frequency, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [profile_id, category_id, description, amount, frequency, end_date || null]
        );
        const [createdTransaction] = await db.query('SELECT * FROM Recurring_Transactions WHERE recurring_id = ?', [newTransaction.insertId]);
        res.status(201).json(createdTransaction[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateRecurringTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const { category_id, description, amount, frequency, end_date } = req.body;

        const [transactions] = await db.query('SELECT RT.profile_id, P.user_id FROM Recurring_Transactions RT JOIN Profiles P ON RT.profile_id = P.profile_id WHERE RT.recurring_id = ?', [transactionId]);
        if (transactions.length === 0 || transactions[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        await db.query(
            'UPDATE Recurring_Transactions SET category_id = ?, description = ?, amount = ?, frequency = ?, end_date = ? WHERE recurring_id = ?',
            [category_id, description, amount, frequency, end_date || null, transactionId]
        );
        const [updatedTransaction] = await db.query('SELECT * FROM Recurring_Transactions WHERE recurring_id = ?', [transactionId]);
        res.status(200).json(updatedTransaction[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteRecurringTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const [transactions] = await db.query('SELECT RT.profile_id, P.user_id FROM Recurring_Transactions RT JOIN Profiles P ON RT.profile_id = P.profile_id WHERE RT.recurring_id = ?', [transactionId]);
        if (transactions.length === 0 || transactions[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await db.query('DELETE FROM Recurring_Transactions WHERE recurring_id = ?', [transactionId]);
        res.status(200).json({ message: `Recurring transaction with id ${transactionId} deleted.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to execute a recurring transaction and create notification
const executeRecurringTransaction = async (recurringTransactionId, accountId, paymentMethodId, userId) => {
    try {
        // Get recurring transaction details
        const [recurringTxs] = await db.query(
            'SELECT RT.*, P.user_id FROM Recurring_Transactions RT JOIN Profiles P ON RT.profile_id = P.profile_id WHERE RT.recurring_id = ?',
            [recurringTransactionId]
        );

        if (recurringTxs.length === 0) {
            throw new Error('Recurring transaction not found');
        }

        const recurringTx = recurringTxs[0];
        
        // Verify user authorization
        if (recurringTx.user_id !== userId) {
            throw new Error('Not authorized');
        }

        // Check if end_date has passed
        if (recurringTx.end_date) {
            const endDate = new Date(recurringTx.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (endDate < today) {
                throw new Error('Recurring transaction has ended');
            }
        }

        // Get account details
        const [accounts] = await db.query('SELECT profile_id, balance FROM Accounts WHERE account_id = ?', [accountId]);
        if (accounts.length === 0) {
            throw new Error('Account not found');
        }
        const account = accounts[0];

        // Verify account belongs to the same profile
        if (account.profile_id !== recurringTx.profile_id) {
            throw new Error('Account does not belong to the same profile');
        }

        // Create the transaction
        const transactionAmount = parseFloat(recurringTx.amount);
        const newBalance = parseFloat(account.balance) - transactionAmount; // Assuming expense by default

        await db.query('UPDATE Accounts SET balance = ? WHERE account_id = ?', [newBalance, accountId]);

        const [newTransaction] = await db.query(
            'INSERT INTO Transactions (account_id, type, amount, description, category_id, payment_method_id) VALUES (?, ?, ?, ?, ?, ?)',
            [accountId, 'expense', transactionAmount, recurringTx.description || 'Recurring Transaction', recurringTx.category_id, paymentMethodId]
        );

        // Create notification
        const message = `Recurring transaction executed: ${recurringTx.description || 'Recurring Transaction'} - ₹${transactionAmount.toFixed(2)}`;
        await db.query(
            'INSERT INTO Notifications (profile_id, message) VALUES (?, ?)',
            [recurringTx.profile_id, message]
        );

        return { success: true, transactionId: newTransaction.insertId };
    } catch (error) {
        console.error('Error executing recurring transaction:', error);
        throw error;
    }
};

// Endpoint to execute a recurring transaction manually
const executeRecurringTransactionEndpoint = async (req, res) => {
    try {
        const { recurringId, accountId, paymentMethodId } = req.body;

        if (!recurringId || !accountId || !paymentMethodId) {
            return res.status(400).json({ message: 'Recurring transaction ID, account ID, and payment method ID are required' });
        }

        const result = await executeRecurringTransaction(recurringId, accountId, paymentMethodId, req.user.user_id);
        res.status(200).json({ message: 'Recurring transaction executed successfully', ...result });
    } catch (error) {
        console.error('Error executing recurring transaction:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = { 
    getRecurringTransactionsByProfile, 
    createRecurringTransaction, 
    updateRecurringTransaction, 
    deleteRecurringTransaction,
    executeRecurringTransaction,
    executeRecurringTransactionEndpoint
};
