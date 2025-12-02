const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration - add your Vercel frontend URL
const allowedOrigins = [
  'http://localhost:3000', // local development
  'http://localhost:5173', // Vite local development
  process.env.FRONTEND_URL, // production frontend URL from env variable
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

app.use(express.json());

app.use('/api/users', require('./routes/users'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/accounts', require('./routes/accounts'));

app.use('/api/transactions', require('./routes/transactions'));

app.use('/api/categories', require('./routes/categories'));
app.use('/api/budgets', require('./routes/budgets'));

app.use('/api/payment-methods', require('./routes/paymentMethods'));

app.use('/api/financial-goals', require('./routes/financialGoals'));

app.use('/api/investments', require('./routes/investments'));
app.use('/api/investment-transactions', require('./routes/investmentTransactions'));

app.use('/api/recurring-transactions', require('./routes/recurringTransactions'));

// NEW: Business profile routes
app.use('/api/clients', require('./routes/clients'));
app.use('/api/invoices', require('./routes/invoices'));

// NEW: Notifications route
app.use('/api/notifications', require('./routes/notifications'));

app.use('/api/summary', require('./routes/summary'));

app.get('/', (req, res) => {
    res.send('Financial Manager API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});