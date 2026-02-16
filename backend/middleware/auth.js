const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Kein Token vorhanden. Zugriff verweigert.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Token ist ungültig.' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token ist ungültig.' });
  }
};

module.exports = auth;

