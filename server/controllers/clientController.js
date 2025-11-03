const db = require('../config/db');

const getClientsByProfile = async (req, res) => {
    try {
        const profileId = req.params.profileId;

        // Check if profile exists and belongs to the user
        const [profiles] = await db.query('SELECT user_id, profile_type FROM Profiles WHERE profile_id = ?', [profileId]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to view these clients' });
        }

        // Ensure it's a business profile
        if (profiles[0].profile_type !== 'business') {
            return res.status(403).json({ message: 'Clients can only be added to business profiles' });
        }

        const [clients] = await db.query('SELECT * FROM Clients WHERE profile_id = ?', [profileId]);
        res.status(200).json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createClient = async (req, res) => {
    try {
        const { profile_id, client_name, email, address } = req.body;

        if (!profile_id || !client_name) {
            return res.status(400).json({ message: 'Profile ID and client name are required' });
        }

        // Check if profile exists and belongs to the user
        const [profiles] = await db.query('SELECT user_id, profile_type FROM Profiles WHERE profile_id = ?', [profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to add a client to this profile' });
        }

        // Ensure it's a business profile
        if (profiles[0].profile_type !== 'business') {
            return res.status(403).json({ message: 'Clients can only be added to business profiles' });
        }

        const [newClient] = await db.query(
            'INSERT INTO Clients (profile_id, client_name, email, address) VALUES (?, ?, ?, ?)',
            [profile_id, client_name, email || null, address || null]
        );

        const [createdClient] = await db.query('SELECT * FROM Clients WHERE client_id = ?', [newClient.insertId]);

        res.status(201).json(createdClient[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateClient = async (req, res) => {
    try {
        const clientId = req.params.id;
        const { client_name, email, address } = req.body;

        // Get the client and verify ownership
        const [clients] = await db.query('SELECT * FROM Clients WHERE client_id = ?', [clientId]);
        const client = clients[0];

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [client.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to update this client' });
        }

        await db.query(
            'UPDATE Clients SET client_name = ?, email = ?, address = ? WHERE client_id = ?',
            [
                client_name || client.client_name,
                email !== undefined ? email : client.email,
                address !== undefined ? address : client.address,
                clientId
            ]
        );

        const [updatedClient] = await db.query('SELECT * FROM Clients WHERE client_id = ?', [clientId]);

        res.status(200).json(updatedClient[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteClient = async (req, res) => {
    try {
        const clientId = req.params.id;

        const [clients] = await db.query('SELECT * FROM Clients WHERE client_id = ?', [clientId]);
        const client = clients[0];

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const [profiles] = await db.query('SELECT user_id FROM Profiles WHERE profile_id = ?', [client.profile_id]);
        if (profiles.length === 0 || profiles[0].user_id !== req.user.user_id) {
            return res.status(401).json({ message: 'Not authorized to delete this client' });
        }

        await db.query('DELETE FROM Clients WHERE client_id = ?', [clientId]);

        res.status(200).json({ message: `Client with id ${clientId} deleted successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getClientsByProfile,
    createClient,
    updateClient,
    deleteClient,
};