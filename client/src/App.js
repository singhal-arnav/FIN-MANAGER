import React, { useState } from 'react';
import { Routes, Route, Navigate} from 'react-router-dom';

import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import Dashboard from './Dashboard';
import AccountPage from './AccountPage'; // 🎯 We use this single file for both Account List/Detail
import CreateProfilePage from './CreateProfilePage'; 
// import AccountsPage from './AccountsPage'; 🛑 REMOVED CONFUSING IMPORT
import CategoriesPage from './CategoriesPage'; 
import Layout from './Layout'; 
import BudgetsPage from './BudgetsPage'; // Assuming you added this for the new feature
import GoalsPage from './GoalsPage';
import InvestmentsPage from './InvestmentsPage';
import RecurringPage from './RecurringPage';

console.log("Token from localStorage:", localStorage.getItem('token'));


function App() {
  // State for the authentication token
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

  // Function to handle successful login (same)
  const handleLoginSuccess = (receivedToken, email) => {
    setToken(receivedToken);
    setUserEmail(email);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('userEmail', email);
  };

  // Function to handle logout (same)
  const handleLogout = () => {
    setToken(null);
    setUserEmail('');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
  };

  // --- RENDER (Logged OUT) ---
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<RegisterPage onRegisterSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // --- RENDER (Logged IN) ---
  return (
    <Routes>
      {/* 1. Parent Route: Wraps all pages that need the Sidebar/Layout. */}
      <Route element={<Layout onLogout={handleLogout} userEmail={userEmail} />}>
            
            {/* Dashboard */}
            <Route 
                path="/dashboard" 
                element={<Dashboard userEmail={userEmail} />} 
            />
            

            {/* 🎯 ACCOUNT LIST VIEW: Uses AccountPage with a special prop */}
            <Route 
                path="/accounts" 
                element={<AccountPage isListView={true} />} // 👈 isListView=true tells the component to show the list/form
            />

            {/* Categories & Budgets (New Features) */}
            <Route 
                path="/categories" 
                element={<CategoriesPage />} 
            />
            

            {/* 🎯 ACCOUNT DETAIL VIEW: Uses AccountPage without the special prop (or isListView=false) */}
            <Route 
                path="/account/:accountId" 
                element={<AccountPage isListView={false} />} // 👈 isListView=false tells the component to show transactions
            />
            <Route 
                path="/goals" 
                element={<GoalsPage />} 
            />
            <Route 
                path="/investments" 
                element={<InvestmentsPage />} /> 

            <Route 
                path="/recurring" 
                element={<RecurringPage />}/>

          
            {/* Profile Creation */}
            <Route 
                path="/profile/create" 
                element={<CreateProfilePage />} 
            />
            
            <Route
                path="/budgets"
                element={<BudgetsPage />}
            />
            

      </Route>
      
      {/* Catch-all redirects to Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" />} />

      
    </Routes>
  );
}

export default App;