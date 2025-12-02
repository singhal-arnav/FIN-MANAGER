import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        email: email,
        password: password
      });

      const receivedToken = response.data.token;
      localStorage.setItem('token', receivedToken);
      onLoginSuccess(receivedToken, email);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials or try again later.');
      }
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
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
          <h1 className="text-3xl font-black text-text-light dark:text-text-dark mb-2">FinTrack</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-negative/10 border border-negative rounded-lg p-3">
                <p className="text-negative text-sm text-center">{error}</p>
              </div>
            )}
            
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
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Sign In
            </button>
          </form>
          
          <p className="mt-6 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;