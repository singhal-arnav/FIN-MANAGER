const db = require('../config/db');

const getAllPaymentMethods = async (req, res) => {
    try {
        const [methods] = await db.query('SELECT * FROM Payment_Methods ORDER BY type');
        res.status(200).json(methods);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createPaymentMethod = async (req, res) => {
    try {
        const { type } = req.body;
        if (!type) {
            return res.status(400).json({ message: 'Payment method type is required' });
        }

        const [newMethod] = await db.query(
            'INSERT INTO Payment_Methods (type) VALUES (?)',
            [type]
        );
        const [createdMethod] = await db.query('SELECT * FROM Payment_Methods WHERE payment_method_id = ?', [newMethod.insertId]);
        res.status(201).json(createdMethod[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'This payment method already exists.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePaymentMethod = async (req, res) => {
    try {
        const methodId = req.params.id;
        const { type } = req.body;

        const [methods] = await db.query('SELECT * FROM Payment_Methods WHERE payment_method_id = ?', [methodId]);
        if (methods.length === 0) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        await db.query('UPDATE Payment_Methods SET type = ? WHERE payment_method_id = ?', [type, methodId]);
        const [updatedMethod] = await db.query('SELECT * FROM Payment_Methods WHERE payment_method_id = ?', [methodId]);
        res.status(200).json(updatedMethod[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'This payment method already exists.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

const deletePaymentMethod = async (req, res) => {
    try {
        const methodId = req.params.id;

        const [methods] = await db.query('SELECT * FROM Payment_Methods WHERE payment_method_id = ?', [methodId]);
        if (methods.length === 0) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        await db.query('DELETE FROM Payment_Methods WHERE payment_method_id = ?', [methodId]);
        res.status(200).json({ message: `Payment method with id ${methodId} deleted.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod };
