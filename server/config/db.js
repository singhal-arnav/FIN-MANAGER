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

// ADD THIS: Wrap the pool to make queries case-insensitive
const promisePool = pool.promise();
const originalQuery = promisePool.query.bind(promisePool);

promisePool.query = function(sql, values) {
    if (typeof sql === 'string') {
        // Convert table names to lowercase in SQL queries
        sql = sql.replace(/FROM\s+`?(\w+)`?/gi, (match, table) => `FROM \`${table.toLowerCase()}\``);
        sql = sql.replace(/JOIN\s+`?(\w+)`?/gi, (match, table) => `JOIN \`${table.toLowerCase()}\``);
        sql = sql.replace(/INTO\s+`?(\w+)`?/gi, (match, table) => `INTO \`${table.toLowerCase()}\``);
        sql = sql.replace(/UPDATE\s+`?(\w+)`?/gi, (match, table) => `UPDATE \`${table.toLowerCase()}\``);
        sql = sql.replace(/TABLE\s+`?(\w+)`?/gi, (match, table) => `TABLE \`${table.toLowerCase()}\``);
    }
    return originalQuery(sql, values);
};

// Test the connection
promisePool.query('SELECT 1')
    .then(() => console.log('✅ Database connection successful'))
    .catch(err => console.error('❌ Database connection failed:', err.message));

module.exports = promisePool;