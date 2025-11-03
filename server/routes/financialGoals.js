const express = require('express');
const router = express.Router();

const {
    getGoalsByProfile,
    createGoal,
    updateGoal,
    deleteGoal
} = require('../controllers/financialGoalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createGoal);

router.route('/profile/:profileId')
    .get(protect, getGoalsByProfile);

router.route('/:id')
    .put(protect, updateGoal)
    .delete(protect, deleteGoal);

module.exports = router;
