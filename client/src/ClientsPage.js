import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function ClientsPage() {
    const [profiles, setProfiles] = useState([]);
    const [businessProfiles, setBusinessProfiles] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedProfile, setSelectedProfile] = useState('');

    // Form state
    const [clientName, setClientName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [formError, setFormError] = useState('');

    // Fetch Clients
    const fetchClients = async (profileId, token) => {
        if (!profileId) return;
        try {
            setLoading(true);
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };
            
            const clientsRes = await axios.get(
                `${API_URL}/clients/profile/${profileId}`,
                authHeaders
            );
            
            setClients(clientsRes.data);
        } catch (err) {
            setError('Could not load clients for this profile.');
        } finally {
            setLoading(false);
        }
    };

    // Initial Data Fetching
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
                
                const profilesRes = await axios.get(`${API_URL}/profiles`, authHeaders);
                const fetchedProfiles = profilesRes.data;

                const business = fetchedProfiles.filter(p => p.profile_type === 'business');
                setProfiles(fetchedProfiles);
                setBusinessProfiles(business);

                if (business.length > 0) {
                    const defaultProfileId = business[0].profile_id;
                    setSelectedProfile(defaultProfileId);
                    await fetchClients(defaultProfileId, token);
                } else {
                    setError('No business profiles found. Clients can only be added to business profiles.');
                    setLoading(false);
                }
            } catch (err) {
                setError('Failed to fetch initial data.');
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Rerun fetch when selectedProfile changes
    useEffect(() => {
        if (selectedProfile) {
            fetchClients(selectedProfile);
        }
    }, [selectedProfile]);

    // Handlers
    const handleCreateClient = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!selectedProfile || !clientName) {
            setFormError('Profile and Client Name are required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const body = {
                profile_id: selectedProfile,
                client_name: clientName,
                email: email || null,
                address: address || null,
            };

            const response = await axios.post(`${API_URL}/clients`, body, authHeaders);
            
            if (response.data.profile_id === selectedProfile) {
                setClients([response.data, ...clients]);
            }
            setClientName('');
            setEmail('');
            setAddress('');
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create client.';
            setFormError(message);
        }
    };

    const handleDeleteClient = async (clientId) => {
        if (!window.confirm("Are you sure you want to delete this client?")) return;

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.delete(`${API_URL}/clients/${clientId}`, authHeaders);
            
            setClients(clients.filter(c => c.client_id !== clientId));
        } catch (err) {
            setFormError('Failed to delete client.');
        }
    };

    // Render Functions
    const renderClientForm = () => {
        if (businessProfiles.length === 0) {
            return <p className="text-negative text-sm text-center mb-4">Please create a **Business Profile** before adding clients.</p>;
        }
        return (
            <form onSubmit={handleCreateClient} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Add New Client</h3>
                {formError && <p className="text-negative text-sm text-center mb-4">{formError}</p>}
                
                <div className="mb-4">
                    <label htmlFor="profileSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Business Profile:</label>
                    <select id="profileSelect" value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                        {businessProfiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="clientName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Client Name:</label>
                    <input id="clientName" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., Acme Corporation" required />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Email (Optional):</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="client@example.com" />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="address" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Address (Optional):</label>
                    <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="123 Main St, City, Country" rows="3" />
                </div>
                
                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Add Client</button>
            </form>
        );
    };

    const renderClientList = () => {
        if (clients.length === 0) {
            return <p className="text-text-muted-light dark:text-text-muted-dark">No clients added for the selected profile.</p>;
        }
        return (
            <div className="space-y-3">
                {clients.map(client => (
                    <div key={client.client_id} className="flex justify-between items-start p-3 bg-background-light dark:bg-background-dark rounded-lg border-l-4 border-l-primary">
                        <div className="flex flex-col flex-1 min-w-0 mr-3">
                            <span className="text-text-light dark:text-text-dark font-semibold text-base">{client.client_name}</span>
                            {client.email && <span className="text-text-muted-light dark:text-text-muted-dark text-xs">Email: {client.email}</span>}
                            {client.address && <span className="text-text-muted-light dark:text-text-muted-dark text-xs">Address: {client.address}</span>}
                        </div>
                        <button onClick={() => handleDeleteClient(client.client_id)} className="ml-2 text-negative text-xl font-bold hover:text-negative/80 transition-colors">&times;</button>
                    </div>
                ))}
            </div>
        );
    };

    // Main Render
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading Clients...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Client Management</h2>
            
            <div className="flex items-center gap-4 mb-8">
                <label className="font-bold text-text-light dark:text-text-dark">View Profile:</label>
                <select value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" disabled={businessProfiles.length === 0}>
                    {businessProfiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {renderClientForm()}
                </div>
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-semibold">Clients for {profiles.find(p => p.profile_id === selectedProfile)?.profile_name || 'Selected Profile'}</h3>
                    {renderClientList()}
                </div>
            </div>
        </div>
    );
}

export default ClientsPage;