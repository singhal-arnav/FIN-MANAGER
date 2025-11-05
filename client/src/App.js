import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import Dashboard from './Dashboard';
import AccountPage from './AccountPage';
import CreateProfilePage from './CreateProfilePage'; 
import CategoriesPage from './CategoriesPage'; 
import Layout from './Layout'; 
import BudgetsPage from './BudgetsPage';
import GoalsPage from './GoalsPage';
import InvestmentsPage from './InvestmentsPage';
import RecurringPage from './RecurringPage';
import ProfileSelector from './ProfileSelector';
import ClientsPage from './ClientsPage';
import InvoicesPage from './InvoicesPage';
import NotificationsPage from './NotificationsPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Load selected profile from localStorage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('selectedProfile');
    if (storedProfile) {
      try {
        setSelectedProfile(JSON.parse(storedProfile));
      } catch (e) {
        localStorage.removeItem('selectedProfile');
      }
    }
  }, []);

  const handleLoginSuccess = (receivedToken, email) => {
    setToken(receivedToken);
    setUserEmail(email);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('userEmail', email);
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail('');
    setSelectedProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('selectedProfile');
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    localStorage.setItem('selectedProfile', JSON.stringify(profile));
  };

  const handleSwitchProfile = () => {
    setSelectedProfile(null);
    localStorage.removeItem('selectedProfile');
  };

  // Not logged in
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<RegisterPage onRegisterSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Logged in but no profile selected
  if (!selectedProfile) {
    return (
      <Routes>
        <Route 
          path="*" 
          element={<ProfileSelector onProfileSelect={handleProfileSelect} />} 
        />
      </Routes>
    );
  }

  // Logged in with profile selected
  const isBusinessProfile = selectedProfile.profile_type === 'business';

  return (
    <Routes>
      <Route element={
        <Layout 
          onLogout={handleLogout} 
          userEmail={userEmail} 
          selectedProfile={selectedProfile}
          onSwitchProfile={handleSwitchProfile}
          isBusinessProfile={isBusinessProfile}
        />
      }>
        <Route 
          path="/dashboard" 
          element={<Dashboard userEmail={userEmail} selectedProfile={selectedProfile} />} 
        />
        
        <Route 
          path="/accounts" 
          element={<AccountPage isListView={true} selectedProfile={selectedProfile} />} 
        />
        
        <Route 
          path="/account/:accountId" 
          element={<AccountPage isListView={false} selectedProfile={selectedProfile} />} 
        />
        
        <Route 
          path="/categories" 
          element={<CategoriesPage selectedProfile={selectedProfile} />} 
        />
        
        <Route 
          path="/budgets" 
          element={<BudgetsPage selectedProfile={selectedProfile} />}
        />
        
        <Route 
          path="/goals" 
          element={<GoalsPage selectedProfile={selectedProfile} />} 
        />
        
        <Route 
          path="/investments" 
          element={<InvestmentsPage selectedProfile={selectedProfile} />} 
        />

        <Route 
          path="/recurring" 
          element={<RecurringPage selectedProfile={selectedProfile} />}
        />
        
        <Route 
          path="/notifications" 
          element={<NotificationsPage selectedProfile={selectedProfile} />}
        />
        
        {/* Business-only routes - redirect personal profiles */}
        <Route 
          path="/clients" 
          element={
            isBusinessProfile 
              ? <ClientsPage selectedProfile={selectedProfile} />
              : <Navigate to="/dashboard" replace />
          }
        />
        
        <Route 
          path="/invoices" 
          element={
            isBusinessProfile 
              ? <InvoicesPage selectedProfile={selectedProfile} />
              : <Navigate to="/dashboard" replace />
          }
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;