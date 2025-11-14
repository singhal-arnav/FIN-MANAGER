const express = require('express');
const router = express.Router();

const {
    getInvoicesByProfile,
    getInvoicesByClient,
    createInvoice,
    updateInvoice,
    deleteInvoice
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createInvoice);

router.route('/profile/:profileId')
    .get(protect, getInvoicesByProfile);

router.route('/client/:clientId')
    .get(protect, getInvoicesByClient);

router.route('/:id')
    .put(protect, updateInvoice)
    .delete(protect, deleteInvoice);

module.exports = router;