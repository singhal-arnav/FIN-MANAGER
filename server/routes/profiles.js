const express = require('express');
const router = express.Router();
const { getProfiles, createProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getProfiles).post(protect, createProfile);

module.exports = router;
