const db = require('../config/db');

const getTransactionsByInvestment = async (req, res) => {
    try {
        const investmentId = req.params.investmentId;

        const [investments] = await db.query('SELECT I.profile_id, P.user_id FROM Investments I JOIN Profiles P ON I.profile_id = P.profile_id WHERE I.investment_id = ?', [investmentId]);
        if (investments.length === 0 || investments[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const [transactions] = await db.query('SELECT * FROM Investment_Transactions WHERE investment_id = ? ORDER BY transaction_date DESC', [investmentId]);
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createInvestmentTransaction = async (req, res) => {
    try {
        const { investment_id, account_id, transaction_type, quantity, price_per_unit, transaction_date } = req.body;
        if (!investment_id || !account_id || !transaction_type || !quantity || !price_per_unit || !transaction_date) {
            return res.status(400).json({ message: 'All fields including account are required' });
        }

        // Verify investment belongs to user
        const [investments] = await db.query('SELECT I.profile_id, P.user_id FROM Investments I JOIN Profiles P ON I.profile_id = P.profile_id WHERE I.investment_id = ?', [investment_id]);
        if (investments.length === 0 || investments[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to add a transaction to this investment' });
        }
        const investment = investments[0];

        // Verify account belongs to user and same profile as investment
        const [accounts] = await db.query('SELECT A.profile_id, A.balance, P.user_id FROM Accounts A JOIN Profiles P ON A.profile_id = P.profile_id WHERE A.account_id = ?', [account_id]);
        if (accounts.length === 0 || accounts[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to use this account' });
        }
        const account = accounts[0];
        
        if (account.profile_id !== investment.profile_id) {
            return res.status(400).json({ message: 'Account and investment must belong to the same profile' });
        }

        // Calculate transaction amount
        const transactionAmount = parseFloat(quantity) * parseFloat(price_per_unit);
        
        // Update account balance
        // Buy = expense (money goes out), Sell = income (money comes in)
        let newBalance;
        if (transaction_type === 'Buy') {
            newBalance = parseFloat(account.balance) - transactionAmount;
        } else if (transaction_type === 'Sell') {
            newBalance = parseFloat(account.balance) + transactionAmount;
        } else {
            return res.status(400).json({ message: 'Invalid transaction type' });
        }

        // Validate newBalance
        if (isNaN(newBalance) || !isFinite(newBalance)) {
            return res.status(400).json({ message: 'Invalid balance calculation' });
        }

        // Update account balance
        const [updateResult] = await db.query('UPDATE Accounts SET balance = ? WHERE account_id = ?', [newBalance, account_id]);
        
        if (!updateResult || updateResult.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update account balance' });
        }

        // Create investment transaction
        const [newTransaction] = await db.query(
            'INSERT INTO Investment_Transactions (investment_id, account_id, transaction_type, quantity, price_per_unit, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
            [investment_id, account_id, transaction_type, quantity, price_per_unit, transaction_date]
        );
        
        const [createdTransaction] = await db.query('SELECT * FROM Investment_Transactions WHERE inv_transaction_id = ?', [newTransaction.insertId]);
        res.status(201).json(createdTransaction[0]);
    } catch (error) {
        console.error('Error creating investment transaction:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getTransactionsByInvestment, createInvestmentTransaction };
