const db = require('../config/db');

const getProfiles = async (req, res) => {
    try {
        const [profiles] = await db.query('SELECT * FROM Profiles WHERE user_id = ?', [req.user.user_id]);
        res.status(200).json(profiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createProfile = async (req, res) => {
    try {
        const { profile_name, profile_type } = req.body;

        if (!profile_name || !profile_type) {
            return res.status(400).json({ message: 'Please provide a profile name and type' });
        }
        
        if (profile_type !== 'personal' && profile_type !== 'business') {
            return res.status(400).json({ message: 'Profile type must be either "personal" or "business"' });
        }

        const [newProfile] = await db.query(
            'INSERT INTO Profiles (user_id, profile_name, profile_type) VALUES (?, ?, ?)',
            [req.user.user_id, profile_name, profile_type]
        );

        const [createdProfile] = await db.query('SELECT * FROM Profiles WHERE profile_id = ?', [newProfile.insertId]);

        res.status(201).json(createdProfile[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfiles,
    createProfile,
};
