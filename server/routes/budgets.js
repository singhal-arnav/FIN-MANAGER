const express = require('express');
const router = express.Router();
const {
    getBudgetsByProfileAndMonth,
    createBudget,
    updateBudget,
    deleteBudget
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createBudget);

router.route('/profile/:profileId/:year/:month')
    .get(protect, getBudgetsByProfileAndMonth);

router.route('/:id')
    .put(protect, updateBudget)
    .delete(protect, deleteBudget);

module.exports = router;
