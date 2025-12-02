const mysql = require('mysql2');

require('dotenv').config();

console.log('=== DATABASE CONFIG DEBUG ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT || '3306 (default)');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : '⚠️ NOT SET');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000 // 10 seconds
});

// Test the connection
pool.promise().query('SELECT 1')
    .then(() => console.log('✅ Database connection successful'))
    .catch(err => console.error('❌ Database connection failed:', err.message));

module.exports = pool.promise();