const db = require('../config/db');

const getInvestmentsByProfile = async (req, res) => {
    try {
        const profileId = req.params.profileId;
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        const [investments] = await db.query('SELECT * FROM Investments WHERE profile_id = ?', [profileId]);
        res.status(200).json(investments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createInvestment = async (req, res) => {
    try {
        const { profile_id, investment_name, investment_type } = req.body;
        if (!profile_id || !investment_name) {
            return res.status(400).json({ message: 'Profile ID and investment name are required' });
        }

        const [profiles] = await db.query('SELECT user_id, profile_type FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (profiles[0].profile_type !== 'personal') {
            return res.status(403).json({ message: 'Investments can only be added to personal profiles.' });
        }

        const [newInvestment] = await db.query(
            'INSERT INTO Investments (profile_id, investment_name, investment_type) VALUES (?, ?, ?)',
            [profile_id, investment_name, investment_type]
        );
        const [createdInvestment] = await db.query('SELECT * FROM Investments WHERE investment_id = ?', [newInvestment.insertId]);
        res.status(201).json(createdInvestment[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateInvestment = async (req, res) => {
    try {
        const investmentId = req.params.id;
        const { investment_name, investment_type } = req.body;
        
        const [investments] = await db.query('SELECT I.profile_id, P.user_id FROM Investments I JOIN Profiles P ON I.profile_id = P.profile_id WHERE I.investment_id = ?', [investmentId]);
        if (investments.length === 0 || investments[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await db.query('UPDATE Investments SET investment_name = ?, investment_type = ? WHERE investment_id = ?', [investment_name, investment_type, investmentId]);
        const [updatedInvestment] = await db.query('SELECT * FROM Investments WHERE investment_id = ?', [investmentId]);
        res.status(200).json(updatedInvestment[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteInvestment = async (req, res) => {
    try {
        const investmentId = req.params.id;
        const [investments] = await db.query('SELECT I.profile_id, P.user_id FROM Investments I JOIN Profiles P ON I.profile_id = P.profile_id WHERE I.investment_id = ?', [investmentId]);
        if (investments.length === 0 || investments[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await db.query('DELETE FROM Investments WHERE investment_id = ?', [investmentId]);
        res.status(200).json({ message: `Investment with id ${investmentId} deleted.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getInvestmentsByProfile, createInvestment, updateInvestment, deleteInvestment };
