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
        const { investment_id, transaction_type, quantity, price_per_unit, transaction_date } = req.body;
        if (!investment_id || !transaction_type || !quantity || !price_per_unit || !transaction_date) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [investments] = await db.query('SELECT I.profile_id, P.user_id FROM Investments I JOIN Profiles P ON I.profile_id = P.profile_id WHERE I.investment_id = ?', [investment_id]);
        if (investments.length === 0 || investments[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to add a transaction to this investment' });
        }

        const [newTransaction] = await db.query(
            'INSERT INTO Investment_Transactions (investment_id, transaction_type, quantity, price_per_unit, transaction_date) VALUES (?, ?, ?, ?, ?)',
            [investment_id, transaction_type, quantity, price_per_unit, transaction_date]
        );
        const [createdTransaction] = await db.query('SELECT * FROM Investment_Transactions WHERE inv_transaction_id = ?', [newTransaction.insertId]);
        res.status(201).json(createdTransaction[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getTransactionsByInvestment, createInvestmentTransaction };
