const express = require('express');
const router = express.Router();
const {
    getRecurringTransactionsByProfile,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    executeRecurringTransactionEndpoint
} = require('../controllers/recurringTransactionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createRecurringTransaction);

router.route('/execute')
    .post(protect, executeRecurringTransactionEndpoint);

router.route('/profile/:profileId')
    .get(protect, getRecurringTransactionsByProfile);

router.route('/:id')
    .put(protect, updateRecurringTransaction)
    .delete(protect, deleteRecurringTransaction);

module.exports = router;
