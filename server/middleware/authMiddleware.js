const jwt = require('jsonwebtoken');
const db = require('../config/db');


const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [rows] = await db.query('SELECT user_id, name, email FROM Users WHERE user_id = ?', [decoded.id]);

            if (rows.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            req.user = rows[0];
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
