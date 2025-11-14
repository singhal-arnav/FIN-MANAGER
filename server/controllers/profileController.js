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

const updateProfile = async (req, res) => {
    try {
        const profileId = req.params.id;
        const { profile_name, profile_type } = req.body;

        // Check if profile belongs to user
        const [profiles] = await db.query('SELECT * FROM Profiles WHERE profile_id = ? AND user_id = ?', [profileId, req.user.user_id]);
        
        if (profiles.length === 0) {
            return res.status(404).json({ message: 'Profile not found or unauthorized' });
        }

        if (profile_type && profile_type !== 'personal' && profile_type !== 'business') {
            return res.status(400).json({ message: 'Profile type must be either "personal" or "business"' });
        }

        await db.query(
            'UPDATE Profiles SET profile_name = ?, profile_type = ? WHERE profile_id = ?',
            [profile_name || profiles[0].profile_name, profile_type || profiles[0].profile_type, profileId]
        );

        const [updatedProfile] = await db.query('SELECT * FROM Profiles WHERE profile_id = ?', [profileId]);

        res.status(200).json(updatedProfile[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const profileId = req.params.id;

        // Check if profile belongs to user
        const [profiles] = await db.query('SELECT * FROM Profiles WHERE profile_id = ? AND user_id = ?', [profileId, req.user.user_id]);
        
        if (profiles.length === 0) {
            return res.status(404).json({ message: 'Profile not found or unauthorized' });
        }

        // Delete the profile (CASCADE will handle related records)
        await db.query('DELETE FROM Profiles WHERE profile_id = ?', [profileId]);

        res.status(200).json({ message: `Profile with id ${profileId} deleted successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
};