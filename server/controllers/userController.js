const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Our database connection

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validation: Check if all fields are present
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please include all fields' });
        }

        // 2. Check if user already exists
        const [userExists] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(400).json({ message: 'A user with this email address already exists. Please use a different email.' });
        }

        // 3. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Insert the new user into the database
        const [newUser] = await db.query(
            'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // 5. If user was created, send back a token
        if (newUser.insertId) {
            res.status(201).json({
                message: 'User registered successfully',
                user_id: newUser.insertId,
                name: name,
                email: email,
                token: generateToken(newUser.insertId)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A user with this email address already exists. Please use a different email.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Login a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        const user = users[0];

        if (user && (await bcrypt.compare(password, user.password))) {

            await db.query('UPDATE Users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

            res.status(200).json({
                message: 'Login successful',
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                token: generateToken(user.user_id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', 
    });
};

module.exports = {
    registerUser,
    loginUser,
};
