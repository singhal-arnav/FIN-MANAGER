import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function InvoicesPage() {
    const [profiles, setProfiles] = useState([]);
    const [businessProfiles, setBusinessProfiles] = useState([]);
    const [clients, setClients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedProfile, setSelectedProfile] = useState('');

    // Form state
    const [selectedClient, setSelectedClient] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('draft');
    const [formError, setFormError] = useState('');

    const STATUS_OPTIONS = ['draft', 'sent', 'paid', 'overdue', 'void'];

    // Fetch Invoices
    const fetchInvoices = async (profileId, token) => {
        if (!profileId) return;
        try {
            setLoading(true);
            const authHeaders = { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } };
            
            const invoicesRes = await axios.get(
                `${API_URL}/invoices/profile/${profileId}`,
                authHeaders
            );
            
            setInvoices(invoicesRes.data);
        } catch (err) {
            setError('Could not load invoices for this profile.');
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
                    
                    // Fetch clients for this profile
                    const clientsRes = await axios.get(`${API_URL}/clients/profile/${defaultProfileId}`, authHeaders);
                    setClients(clientsRes.data);
                    if (clientsRes.data.length > 0) {
                        setSelectedClient(clientsRes.data[0].client_id);
                    }
                    
                    await fetchInvoices(defaultProfileId, token);
                } else {
                    setError('No business profiles found. Invoices can only be added to business profiles.');
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
            const fetchProfileData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
                    
                    const clientsRes = await axios.get(`${API_URL}/clients/profile/${selectedProfile}`, authHeaders);
                    setClients(clientsRes.data);
                    if (clientsRes.data.length > 0) {
                        setSelectedClient(clientsRes.data[0].client_id);
                    } else {
                        setSelectedClient('');
                    }
                    
                    fetchInvoices(selectedProfile);
                } catch (err) {
                    setFormError('Failed to load clients for this profile.');
                }
            };
            
            fetchProfileData();
        }
    }, [selectedProfile]);

    // Handlers
    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!selectedProfile || !selectedClient || !invoiceNumber || !amount || !issueDate || !dueDate) {
            setFormError('All fields except status are required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const body = {
                profile_id: selectedProfile,
                client_id: selectedClient,
                invoice_number: invoiceNumber,
                amount: parseFloat(amount),
                issue_date: issueDate,
                due_date: dueDate,
                status: status,
            };

            const response = await axios.post(`${API_URL}/invoices`, body, authHeaders);
            
            if (response.data.profile_id === selectedProfile) {
                setInvoices([response.data, ...invoices]);
            }
            
            setInvoiceNumber('');
            setAmount('');
            setIssueDate('');
            setDueDate('');
            setStatus('draft');
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create invoice.';
            setFormError(message);
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;

        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.delete(`${API_URL}/invoices/${invoiceId}`, authHeaders);
            
            setInvoices(invoices.filter(inv => inv.invoice_id !== invoiceId));
        } catch (err) {
            setFormError('Failed to delete invoice.');
        }
    };

    const handleUpdateStatus = async (invoiceId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            
            await axios.put(`${API_URL}/invoices/${invoiceId}`, { status: newStatus }, authHeaders);
            
            setInvoices(invoices.map(inv => 
                inv.invoice_id === invoiceId 
                    ? { ...inv, status: newStatus }
                    : inv
            ));
        } catch (err) {
            setFormError('Failed to update invoice status.');
        }
    };

    // Render Functions
    const renderInvoiceForm = () => {
        if (businessProfiles.length === 0) {
            return <p className="text-negative text-sm text-center mb-4">Please create a **Business Profile** before adding invoices.</p>;
        }
        if (clients.length === 0) {
            return <p className="text-negative text-sm text-center mb-4">Please add at least one client before creating invoices.</p>;
        }
        return (
            <form onSubmit={handleCreateInvoice} className="flex flex-col h-full">
                <h3 className="text-text-light dark:text-text-dark text-lg font-semibold mb-4">Create New Invoice</h3>
                {formError && <p className="text-negative text-sm text-center mb-4">{formError}</p>}
                
                <div className="mb-4">
                    <label htmlFor="profileSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Business Profile:</label>
                    <select id="profileSelect" value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                        {businessProfiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="clientSelect" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Client:</label>
                    <select id="clientSelect" value={selectedClient} onChange={(e) => setSelectedClient(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" disabled={clients.length === 0}>
                        {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.client_name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Invoice #:</label>
                        <input id="invoiceNumber" type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="INV-001" required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Amount ($):</label>
                        <input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="issueDate" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Issue Date:</label>
                        <input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Due Date:</label>
                        <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="status" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Status:</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                </div>
                
                <button type="submit" className="mt-auto w-full py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Create Invoice</button>
            </form>
        );
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'paid': return 'text-positive';
            case 'sent': return 'text-primary';
            case 'overdue': return 'text-negative';
            case 'void': return 'text-text-muted-light dark:text-text-muted-dark';
            default: return 'text-text-light dark:text-text-dark';
        }
    };

    const renderInvoiceList = () => {
        if (invoices.length === 0) {
            return <p className="text-text-muted-light dark:text-text-muted-dark">No invoices created for the selected profile.</p>;
        }
        return (
            <div className="space-y-3">
                {invoices.map(invoice => {
                    const client = clients.find(c => c.client_id === invoice.client_id);
                    return (
                        <div key={invoice.invoice_id} className="flex justify-between items-start p-3 bg-background-light dark:bg-background-dark rounded-lg border-l-4 border-l-primary">
                            <div className="flex flex-col flex-1 min-w-0 mr-3">
                                <span className="text-text-light dark:text-text-dark font-semibold text-base">{invoice.invoice_number}</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark text-xs">Client: {client?.client_name || 'Unknown'}</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark text-xs">Amount: ${parseFloat(invoice.amount).toFixed(2)}</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark text-xs">Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                                <div className="mt-1">
                                    <select 
                                        value={invoice.status} 
                                        onChange={(e) => handleUpdateStatus(invoice.invoice_id, e.target.value)}
                                        className={`text-xs px-2 py-1 rounded border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark ${getStatusColor(invoice.status)}`}
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteInvoice(invoice.invoice_id)} className="ml-2 text-negative text-xl font-bold hover:text-negative/80 transition-colors">&times;</button>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Main Render
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-text-muted-light dark:text-text-muted-dark">Loading Invoices...</div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-negative">{error}</p>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            <h2 className="text-text-light dark:text-text-dark text-3xl font-bold mb-8 pb-4 border-b border-border-light dark:border-border-dark">Invoice Management</h2>
            
            <div className="flex items-center gap-4 mb-8">
                <label className="font-bold text-text-light dark:text-text-dark">View Profile:</label>
                <select value={selectedProfile} onChange={(e) => setSelectedProfile(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" disabled={businessProfiles.length === 0}>
                    {businessProfiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.profile_name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    {renderInvoiceForm()}
                </div>
                <div className="flex flex-col gap-4 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-semibold">Invoices for {profiles.find(p => p.profile_id === selectedProfile)?.profile_name || 'Selected Profile'}</h3>
                    {renderInvoiceList()}
                </div>
            </div>
        </div>
    );
}

export default InvoicesPage;