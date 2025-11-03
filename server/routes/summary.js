const express = require('express');
const router = express.Router();
const { getTotalNetWorth } = require('../controllers/accountController'); // We'll put the function in accountController for simplicity
const { protect } = require('../middleware/authMiddleware');

// GET /api/summary/net-worth
router.route('/net-worth')
    .get(protect, getTotalNetWorth);

module.exports = router;