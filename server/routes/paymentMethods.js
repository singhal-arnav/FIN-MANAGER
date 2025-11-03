const express = require('express');
const router = express.Router();
const {
    getAllPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
} = require('../controllers/paymentMethodController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAllPaymentMethods)
    .post(protect, createPaymentMethod);

router.route('/:id')
    .put(protect, updatePaymentMethod)
    .delete(protect, deletePaymentMethod);

module.exports = router;
