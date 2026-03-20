const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await db.query(
      'SELECT id, phone, email, first_name, last_name, membership_tier, is_active FROM users WHERE id = $1',
      [payload.userId]
    );
    if (!rows[0] || !rows[0].is_active)
      return res.status(401).json({ error: 'User not found or inactive' });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user?.is_admin)
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { authenticate, isAdmin };
