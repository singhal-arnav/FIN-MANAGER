const db = require('../config/db');

const getInvoicesByProfile = async (req, res) => {
    try {
        const profileId = req.params.profileId;

        // Check if profile exists and belongs to the user
        const [profiles] = await db.query('SELECT user_id, profile_type FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view these invoices' });
        }

        // Ensure it's a business profile
        if (profiles[0].profile_type !== 'business') {
            return res.status(403).json({ message: 'Invoices can only be accessed from business profiles' });
        }

        const [invoices] = await db.query('SELECT * FROM Invoices WHERE profile_id = ? ORDER BY issue_date DESC', [profileId]);
        res.status(200).json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getInvoicesByClient = async (req, res) => {
    try {
        const clientId = req.params.clientId;

        // Verify the client belongs to a profile owned by the user
        const [clients] = await db.query('SELECT C.profile_id, P.user_id FROM Clients C JOIN Profiles P ON C.profile_id = P.profile_id WHERE C.client_id = ?', [clientId]);
        
        if (clients.length === 0 || clients[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view invoices for this client' });
        }

        const [invoices] = await db.query('SELECT * FROM Invoices WHERE client_id = ? ORDER BY issue_date DESC', [clientId]);
        res.status(200).json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createInvoice = async (req, res) => {
    try {
        const { client_id, profile_id, invoice_number, amount, issue_date, due_date, status } = req.body;

        if (!client_id || !profile_id || !invoice_number || !amount || !issue_date || !due_date) {
            return res.status(400).json({ message: 'Client ID, profile ID, invoice number, amount, issue date, and due date are required' });
        }

        // Check if profile exists and belongs to the user
        const [profiles] = await db.query('SELECT user_id, profile_type FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to create an invoice for this profile' });
        }

        // Ensure it's a business profile
        if (profiles[0].profile_type !== 'business') {
            return res.status(403).json({ message: 'Invoices can only be created for business profiles' });
        }

        // Verify the client belongs to this profile
        const [clients] = await db.query('SELECT * FROM Clients WHERE client_id = ? AND profile_id = ?', [client_id, profile_id]);
        if (clients.length === 0) {
            return res.status(400).json({ message: 'Client does not belong to this profile' });
        }

        const [newInvoice] = await db.query(
            'INSERT INTO Invoices (client_id, profile_id, invoice_number, amount, issue_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [client_id, profile_id, invoice_number, amount, issue_date, due_date, status || 'draft']
        );

        const [createdInvoice] = await db.query('SELECT * FROM Invoices WHERE invoice_id = ?', [newInvoice.insertId]);

        res.status(201).json(createdInvoice[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateInvoice = async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const { invoice_number, amount, issue_date, due_date, status } = req.body;

        // Get the invoice and verify ownership
        const [invoices] = await db.query('SELECT * FROM Invoices WHERE invoice_id = ?', [invoiceId]);
        const invoice = invoices[0];

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [invoice.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to update this invoice' });
        }

        // Validate status if provided
        const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'void'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        await db.query(
            'UPDATE Invoices SET invoice_number = ?, amount = ?, issue_date = ?, due_date = ?, status = ? WHERE invoice_id = ?',
            [
                invoice_number || invoice.invoice_number,
                amount !== undefined ? amount : invoice.amount,
                issue_date || invoice.issue_date,
                due_date || invoice.due_date,
                status || invoice.status,
                invoiceId
            ]
        );

        const [updatedInvoice] = await db.query('SELECT * FROM Invoices WHERE invoice_id = ?', [invoiceId]);

        res.status(200).json(updatedInvoice[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteInvoice = async (req, res) => {
    try {
        const invoiceId = req.params.id;

        const [invoices] = await db.query('SELECT * FROM Invoices WHERE invoice_id = ?', [invoiceId]);
        const invoice = invoices[0];

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [invoice.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to delete this invoice' });
        }

        await db.query('DELETE FROM Invoices WHERE invoice_id = ?', [invoiceId]);

        res.status(200).json({ message: `Invoice with id ${invoiceId} deleted successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getInvoicesByProfile,
    getInvoicesByClient,
    createInvoice,
    updateInvoice,
    deleteInvoice,
};