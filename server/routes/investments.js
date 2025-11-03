const express = require('express');
const router = express.Router();
const {
    getInvestmentsByProfile,
    createInvestment,
    updateInvestment,
    deleteInvestment
} = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createInvestment);

router.route('/profile/:profileId')
    .get(protect, getInvestmentsByProfile);

router.route('/:id')
    .put(protect, updateInvestment)
    .delete(protect, deleteInvestment);

module.exports = router;
