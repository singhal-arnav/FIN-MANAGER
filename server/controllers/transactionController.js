const db = require('../config/db');

const getAllUserTransactions = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const limit = parseInt(req.query.limit) || 10;

        const [transactions] = await db.query(
            'SELECT T.*, C.name as category_name, A.name as account_name ' +
            'FROM Transactions T ' +
            'JOIN Accounts A ON T.account_id = A.account_id ' +
            'JOIN Profiles P ON A.profile_id = P.profile_id ' +
            'LEFT JOIN Categories C ON T.category_id = C.category_id ' +
            'WHERE P.user_id = ? ' +
            'ORDER BY T.time_stamp DESC ' +
            'LIMIT ?',
            [userId, limit]
        );

        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getTransactionsByAccount = async (req, res) => {
    try {
        const accountId = req.params.accountId;

        const [accounts] = await db.query('SELECT profile_id FROM Accounts WHERE account_id = ?', [accountId]);
        if (accounts.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [accounts[0].profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view these transactions' });
        }

        const [transactions] = await db.query('SELECT * FROM Transactions WHERE account_id = ? ORDER BY time_stamp DESC', [accountId]);
        res.status(200).json(transactions);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getTransactionsByProfile = async (req, res) => {
    try {
        const { profileId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view these transactions' });
        }

        const [transactions] = await db.query(
            'SELECT T.*, C.name as category_name, A.name as account_name ' +
            'FROM Transactions T ' +
            'JOIN Accounts A ON T.account_id = A.account_id ' +
            'LEFT JOIN Categories C ON T.category_id = C.category_id ' +
            'WHERE A.profile_id = ? ' +
            'ORDER BY T.time_stamp DESC ' +
            'LIMIT ?',
            [profileId, limit]
        );

        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createTransaction = async (req, res) => {
    try {
        const { account_id, type, amount, description, category_id, payment_method_id } = req.body;

        if (!account_id || !type || !amount || !category_id || !payment_method_id) {
            return res.status(400).json({ message: 'Account ID, type, amount, category, and payment method are required' });
        }

        const [accounts] = await db.query('SELECT profile_id, balance FROM Accounts WHERE account_id = ?', [account_id]);
        if (accounts.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }
        const account = accounts[0];

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [account.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to add a transaction to this account' });
        }

        let newBalance;
        if (type === 'income') {
            newBalance = parseFloat(account.balance) + parseFloat(amount);
        } else if (type === 'expense') {
            newBalance = parseFloat(account.balance) - parseFloat(amount);
        } else {
            return res.status(400).json({ message: 'Invalid transaction type' });
        }

        await db.query('UPDATE Accounts SET balance = ? WHERE account_id = ?', [newBalance, account_id]);

        const [newTransaction] = await db.query(
            'INSERT INTO Transactions (account_id, type, amount, description, category_id, payment_method_id) VALUES (?, ?, ?, ?, ?, ?)',
            [account_id, type, amount, description, category_id, payment_method_id]
        );
        
        const [createdTransaction] = await db.query('SELECT * FROM Transactions WHERE transaction_id = ?', [newTransaction.insertId]);

        // Check for budget exceeded notification (only for expense transactions)
        if (type === 'expense' && category_id) {
            try {
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                // Check if there's a budget for this category in the current month/year
                const [budgets] = await db.query(
                    'SELECT B.*, ' +
                    'COALESCE( (' +
                        'SELECT SUM(T.amount) FROM Transactions T ' +
                        'JOIN Accounts A ON T.account_id = A.account_id ' +
                        'WHERE T.category_id = B.category_id ' +
                        'AND A.profile_id = B.profile_id ' +
                        'AND T.type = "expense" ' +
                        'AND YEAR(T.time_stamp) = B.year ' +
                        'AND MONTH(T.time_stamp) = B.month' +
                    '), 0.00) AS spent_amount ' +
                    'FROM Budgets B ' +
                    'WHERE B.profile_id = ? AND B.category_id = ? AND B.month = ? AND B.year = ?',
                    [account.profile_id, category_id, currentMonth, currentYear]
                );

                if (budgets.length > 0) {
                    const budget = budgets[0];
                    const spentAmount = parseFloat(budget.spent_amount || 0);
                    const budgetLimit = parseFloat(budget.budget);

                    // If spent amount exceeds or equals budget limit, create notification
                    if (spentAmount >= budgetLimit) {
                        const [categories] = await db.query('SELECT name FROM Categories WHERE category_id = ?', [category_id]);
                        const categoryName = categories.length > 0 ? categories[0].name : 'Unknown Category';
                        
                        const message = `Budget exceeded for ${categoryName}: Spent ₹${spentAmount.toFixed(2)} out of ₹${budgetLimit.toFixed(2)} budget for ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.`;
                        
                        await db.query(
                            'INSERT INTO Notifications (profile_id, message) VALUES (?, ?)',
                            [account.profile_id, message]
                        );
                    }
                }
            } catch (budgetError) {
                // Don't fail the transaction if budget check fails
                console.error('Error checking budget for notification:', budgetError);
            }
        }

        res.status(201).json(createdTransaction[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteTransaction = async (req, res) => {
     try {
        const transactionId = req.params.id;

        const [transactions] = await db.query('SELECT * FROM Transactions WHERE transaction_id = ?', [transactionId]);
        if (transactions.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        const transaction = transactions[0];

        const [accounts] = await db.query('SELECT profile_id, balance FROM Accounts WHERE account_id = ?', [transaction.account_id]);
        if (accounts.length === 0) { return res.status(404).json({ message: 'Associated account not found' }); }
        const account = accounts[0];

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [account.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to delete this transaction' });
        }

        let reversedBalance;
        if (transaction.type === 'income') {
            reversedBalance = parseFloat(account.balance) - parseFloat(transaction.amount);
        } else { 
            reversedBalance = parseFloat(account.balance) + parseFloat(transaction.amount);
        }

        await db.query('UPDATE Accounts SET balance = ? WHERE account_id = ?', [reversedBalance, transaction.account_id]);

        await db.query('DELETE FROM Transactions WHERE transaction_id = ?', [transactionId]);
        
        res.status(200).json({ message: `Transaction with id ${transactionId} deleted and account balance updated.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAllUserTransactions,
    getTransactionsByProfile,
    getTransactionsByAccount,
    createTransaction,
    deleteTransaction,
};

