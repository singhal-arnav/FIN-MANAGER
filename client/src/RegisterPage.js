import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function RegisterPage({ onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [showProfileStep, setShowProfileStep] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileType, setProfileType] = useState('personal');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/users/register`, {
        name: name,
        email: email,
        password: password
      });

      // After successful registration, show profile creation step
      const receivedToken = response.data.token;
      localStorage.setItem('token', receivedToken);
      
      setMessage('Registration successful! Now create your first profile...');
      setShowProfileStep(true);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again later.');
      }
      console.error('Registration error:', err);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setError('');

    if (!profileName) {
      setError('Profile Name is required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const body = {
        profile_name: profileName,
        profile_type: profileType
      };

      await axios.post(`${API_URL}/profiles`, body, authHeaders);

      // Successfully created profile, now redirect
      if (onRegisterSuccess) {
        onRegisterSuccess(token, email);
      }
      navigate('/dashboard');

    } catch (err) {
      setError('Failed to create profile. Please check your network connection.');
      console.error('Create profile error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary size-16 flex items-center justify-center rounded-xl">
              <svg fill="white" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-text-light dark:text-text-dark mb-2">
            {showProfileStep ? 'Create Your First Profile' : 'Get Started'}
          </h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">
            {showProfileStep ? 'Let\'s set up your financial profile' : 'Create your FinTrack account'}
          </p>
        </div>

        {/* Profile Creation Step */}
        {showProfileStep ? (
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-8 shadow-lg">
            <form onSubmit={handleCreateProfile} className="space-y-6">
              {error && (
                <div className="bg-negative/10 border border-negative rounded-lg p-3">
                  <p className="text-negative text-sm text-center">{error}</p>
                </div>
              )}
              {message && (
                <div className="bg-positive/10 border border-positive rounded-lg p-3">
                  <p className="text-positive text-sm text-center">{message}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="profileName" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  id="profileName"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g., Personal Finances"
                />
              </div>
              
              <div>
                <label htmlFor="profileType" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Account Type
                </label>
                <select
                  id="profileType"
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value)}
                  className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Complete Setup
              </button>
            </form>
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-8 shadow-lg">
            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <div className="bg-negative/10 border border-negative rounded-lg p-3">
                  <p className="text-negative text-sm text-center">{error}</p>
                </div>
              )}
              {message && (
                <div className="bg-positive/10 border border-positive rounded-lg p-3">
                  <p className="text-positive text-sm text-center">{message}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Create a password"
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Create Account
              </button>
            </form>
            
            <p className="mt-6 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;