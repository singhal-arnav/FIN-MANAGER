const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'PFMS'
});

const paymentMethods = [
    'Credit Card',
    'Debit Card',
    'Cash',
    'Bank Transfer',
    'PayPal',
    'Venmo',
    'Zelle',
    'Check',
    'Apple Pay',
    'Google Pay'
];

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    
    console.log('Connected to database. Seeding payment methods...');
    
    let inserted = 0;
    let skipped = 0;
    
    paymentMethods.forEach((type, index) => {
        connection.query(
            'INSERT IGNORE INTO Payment_Methods (type) VALUES (?)',
            [type],
            (error, results) => {
                if (error) {
                    console.error(`Error inserting ${type}:`, error);
                } else {
                    if (results.affectedRows > 0) {
                        console.log(`✓ Inserted: ${type}`);
                        inserted++;
                    } else {
                        console.log(`- Skipped (already exists): ${type}`);
                        skipped++;
                    }
                }
                
                // Check if this is the last query
                if (index === paymentMethods.length - 1) {
                    console.log(`\nSummary: ${inserted} inserted, ${skipped} skipped`);
                    connection.end();
                    console.log('Payment methods seeding complete!');
                }
            }
        );
    });
});

