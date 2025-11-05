const db = require('../config/db');

const getCategoriesByProfile = async (req, res) => {
    try {
        const profileId = req.params.profileId;
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        const [categories] = await db.query('SELECT * FROM Categories WHERE profile_id = ?', [profileId]);
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { profile_id, name, parent_category_id } = req.body;
        if (!profile_id || !name) {
            return res.status(400).json({ message: 'Profile ID and category name are required' });
        }
       
        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Normalize name for duplicate checking (trim and case-insensitive)
        const normalizedName = name.trim();
        if (!normalizedName) {
            return res.status(400).json({ message: 'Category name cannot be empty' });
        }

        // Application-level duplicate guard (works even if DB schema not migrated)
        const [existing] = await db.query(
            'SELECT 1 FROM Categories WHERE profile_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
            [profile_id, normalizedName]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'A category with this name already exists for this profile.' });
        }

        const [newCategory] = await db.query(
            'INSERT INTO Categories (profile_id, name, parent_category_id) VALUES (?, ?, ?)',
            [profile_id, normalizedName, parent_category_id || null]
        );
        const [createdCategory] = await db.query('SELECT * FROM Categories WHERE category_id = ?', [newCategory.insertId]);
        res.status(201).json(createdCategory[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A category with this name already exists for this profile.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name } = req.body;
       
        const [categories] = await db.query('SELECT C.profile_id, P.user_id FROM Categories C JOIN Profiles P ON C.profile_id = P.profile_id WHERE C.category_id = ?', [categoryId]);
        if (categories.length === 0 || categories[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const normalizedName = (name || '').trim();
        if (!normalizedName) {
            return res.status(400).json({ message: 'Category name cannot be empty' });
        }

        // Prevent duplicates on update as well
        const profileId = categories[0].profile_id;
        const [dup] = await db.query(
            'SELECT 1 FROM Categories WHERE profile_id = ? AND LOWER(name) = LOWER(?) AND category_id <> ? LIMIT 1',
            [profileId, normalizedName, categoryId]
        );
        if (dup.length > 0) {
            return res.status(400).json({ message: 'A category with this name already exists for this profile.' });
        }

        await db.query('UPDATE Categories SET name = ? WHERE category_id = ?', [normalizedName, categoryId]);
        const [updatedCategory] = await db.query('SELECT * FROM Categories WHERE category_id = ?', [categoryId]);
        res.status(200).json(updatedCategory[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A category with this name already exists for this profile.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
       
        const [categories] = await db.query('SELECT C.profile_id, P.user_id FROM Categories C JOIN Profiles P ON C.profile_id = P.profile_id WHERE C.category_id = ?', [categoryId]);
        if (categories.length === 0 || categories[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await db.query('DELETE FROM Categories WHERE category_id = ?', [categoryId]);
        res.status(200).json({ message: `Category with id ${categoryId} deleted.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAllUserCategories = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Query to fetch all categories belonging to the user's profiles
        const [categories] = await db.query(
            'SELECT C.* FROM Categories C ' +
            'JOIN Profiles P ON C.profile_id = P.profile_id ' +
            'WHERE P.user_id = ?',
            [userId]
        );

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching all user categories:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getAllUserCategories,getCategoriesByProfile, createCategory, updateCategory, deleteCategory };
