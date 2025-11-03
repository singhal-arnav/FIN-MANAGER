const db = require('../config/db');

const getBudgetsByProfileAndMonth = async (req, res) => {
    try {
        const { profileId, year, month } = req.params;
        
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        // FINAL CORRECTED QUERY: Calculates SPENT amount by linking Transactions -> Accounts -> Profile
        const [budgets] = await db.query(
            'SELECT B.*, ' +
            'COALESCE( (' +
                'SELECT SUM(T.amount) FROM Transactions T ' +
                'JOIN Accounts A ON T.account_id = A.account_id ' + // Link T to A
                
                'WHERE T.category_id = B.category_id ' +
                'AND A.profile_id = B.profile_id ' + // Filter by the Budget's Profile ID
                'AND T.type = "expense" ' + // Budgets only track expenses
                
                // Use the correct date column name: time_stamp
                'AND YEAR(T.time_stamp) = B.year ' + 
                'AND MONTH(T.time_stamp) = B.month' +
            '), 0.00) AS spent_amount ' + 
            
            // Main query body
            'FROM Budgets B ' +
            'WHERE B.profile_id = ? AND B.year = ? AND B.month = ?',
            [profileId, year, month]
        ); 

        res.status(200).json(budgets);
    } catch (error) {
        // Log the error to your console for debugging
        console.error('CRITICAL BUDGET FETCH ERROR:', error); 
        res.status(500).json({ message: 'Server Error in Budget Fetch' });
    }
};

const createBudget = async (req, res) => {
    try {
        const { profile_id, category_id, budget, month, year } = req.body;

        const [categories] = await db.query(
            'SELECT C.category_id FROM Categories C JOIN Profiles P ON C.profile_id = P.profile_id WHERE C.category_id = ? AND P.user_id = ? AND C.profile_id = ?',
            [category_id, req.user.user_id, profile_id]
        );

        if (categories.length === 0) {
            return res.status(401).json({ message: 'Authorization failed: The category does not exist or does not belong to this profile.' });
        }
        

        const [newBudget] = await db.query(
            'INSERT INTO Budgets (profile_id, category_id, budget, month, year) VALUES (?, ?, ?, ?, ?)',
            [profile_id, category_id, budget, month, year]
        );
        const [createdBudget] = await db.query('SELECT * FROM Budgets WHERE budget_id = ?', [newBudget.insertId]);
        res.status(201).json(createdBudget[0]);
    } catch (error) {
    
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A budget for this category already exists for this month and year.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const updateBudget = async (req, res) => {
     try {
        const budgetId = req.params.id;
        const { budget } = req.body;
    
        const [budgets] = await db.query('SELECT B.profile_id, P.user_id FROM Budgets B JOIN Profiles P ON B.profile_id = P.profile_id WHERE B.budget_id = ?', [budgetId]);
        if (budgets.length === 0 || budgets[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await db.query('UPDATE Budgets SET budget = ? WHERE budget_id = ?', [budget, budgetId]);
        const [updatedBudget] = await db.query('SELECT * FROM Budgets WHERE budget_id = ?', [budgetId]);
        res.status(200).json(updatedBudget[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteBudget = async (req, res) => {
    try {
        const budgetId = req.params.id;
     
        const [budgets] = await db.query('SELECT B.profile_id, P.user_id FROM Budgets B JOIN Profiles P ON B.profile_id = P.profile_id WHERE B.budget_id = ?', [budgetId]);
        if (budgets.length === 0 || budgets[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await db.query('DELETE FROM Budgets WHERE budget_id = ?', [budgetId]);
        res.status(200).json({ message: `Budget with id ${budgetId} deleted.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = { getBudgetsByProfileAndMonth, createBudget, updateBudget, deleteBudget };

