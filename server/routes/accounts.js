const express = require('express');
const router = express.Router();

const {
    getAllUserAccounts, // Import the new function
    getAccountsByProfile,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountDetails,
    getHistoricalNetWorth
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

// This is the new route your frontend is looking for:
// GET /api/accounts
router.route('/')
    .get(protect, getAllUserAccounts) // Add the GET handler
    .post(protect, createAccount);

router.route('/profile/:profileId/net-worth-history')
    .get(protect, getHistoricalNetWorth);

router.route('/profile/:profileId')
    .get(protect, getAccountsByProfile);

router.route('/:id')
    .get(protect, getAccountDetails)
    .put(protect, updateAccount)
    .delete(protect, deleteAccount);

module.exports = router;

