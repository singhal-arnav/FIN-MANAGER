const express = require('express');
const router = express.Router();
const {
    getCategoriesByProfile,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllUserCategories
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createCategory)
    .get(protect, getAllUserCategories);

router.route('/profile/:profileId')
    .get(protect, getCategoriesByProfile);

router.route('/:id')
    .put(protect, updateCategory)
    .delete(protect, deleteCategory);

module.exports = router;
