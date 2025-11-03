const express = require('express');
const router = express.Router();
const {
    getTransactionsByInvestment,
    createInvestmentTransaction
} = require('../controllers/investmentTransactionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createInvestmentTransaction);

router.route('/:investmentId')
    .get(protect, getTransactionsByInvestment);

module.exports = router;
