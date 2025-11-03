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

module.exports = { getRecurringTransactionsByProfile, createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction };
