const express = require('express');
const router = express.Router();

const {
    getClientsByProfile,
    createClient,
    updateClient,
    deleteClient
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createClient);

router.route('/profile/:profileId')
    .get(protect, getClientsByProfile);

router.route('/:id')
    .put(protect, updateClient)
    .delete(protect, deleteClient);

module.exports = router;