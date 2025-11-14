const db = require('../config/db');

const getGoalsByProfile = async (req, res) => {
    try {
        const profileId = req.params.profileId;
       
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        const [goals] = await db.query('SELECT * FROM Financial_Goals WHERE profile_id = ?', [profileId]);
        res.status(200).json(goals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createGoal = async (req, res) => {
    try {
        const { profile_id, goal_name, target_amount, target_date } = req.body;

        if (!profile_id || !goal_name || !target_amount) {
            return res.status(400).json({ message: 'Profile ID, goal name, and target amount are required' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const [newGoal] = await db.query(
            'INSERT INTO Financial_Goals (profile_id, goal_name, target_amount, target_date) VALUES (?, ?, ?, ?)',
            [profile_id, goal_name, target_amount, target_date || null]
        );
        const [createdGoal] = await db.query('SELECT * FROM Financial_Goals WHERE goal_id = ?', [newGoal.insertId]);
        res.status(201).json(createdGoal[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A goal with the same name, target amount, and target date already exists for this profile.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateGoal = async (req, res) => {
     try {
        const goalId = req.params.id;
        const { goal_name, target_amount, current_amount, target_date, status } = req.body;
       
        const [goals] = await db.query('SELECT G.profile_id, P.user_id FROM Financial_Goals G JOIN Profiles P ON G.profile_id = P.profile_id WHERE G.goal_id = ?', [goalId]);
        if (goals.length === 0 || goals[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
    
        const [currentGoals] = await db.query('SELECT * FROM Financial_Goals WHERE goal_id = ?', [goalId]);
        const currentGoal = currentGoals[0];

        await db.query(
            'UPDATE Financial_Goals SET goal_name = ?, target_amount = ?, current_amount = ?, target_date = ?, status = ? WHERE goal_id = ?',
            [
                goal_name || currentGoal.goal_name,
                target_amount || currentGoal.target_amount,
                current_amount || currentGoal.current_amount,
                target_date || currentGoal.target_date,
                status || currentGoal.status,
                goalId
            ]
        );
        const [updatedGoal] = await db.query('SELECT * FROM Financial_Goals WHERE goal_id = ?', [goalId]);
        res.status(200).json(updatedGoal[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A goal with the same name, target amount, and target date already exists for this profile.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const goalId = req.params.id;
        const [goals] = await db.query('SELECT G.profile_id, P.user_id FROM Financial_Goals G JOIN Profiles P ON G.profile_id = P.profile_id WHERE goal_id = ?', [goalId]);
        if (goals.length === 0 || goals[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await db.query('DELETE FROM Financial_Goals WHERE goal_id = ?', [goalId]);
        res.status(200).json({ message: `Financial goal with id ${goalId} deleted.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getGoalsByProfile, createGoal, updateGoal, deleteGoal };
