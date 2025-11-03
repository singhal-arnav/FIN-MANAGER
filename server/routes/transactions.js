const express = require('express');
const router = express.Router();

const {
    getAllUserTransactions,
    getTransactionsByAccount,
    createTransaction,
    deleteTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAllUserTransactions)
    .post(protect, createTransaction);

router.route('/account/:accountId')
    .get(protect, getTransactionsByAccount);

router.route('/:id')
    .delete(protect, deleteTransaction);

module.exports = router;

