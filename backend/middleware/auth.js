const jwt = require('jsonwebtoken');

// Middleware: Authenticate user via JWT from headers or cookies
const authenticate = (req, res, next) => {
  try {
    let token;

    if (req.header('Authorization')?.startsWith('Bearer ')) {
      token = req.header('Authorization')?.replace('Bearer ', '');
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Middleware: Authorize student role
const authenticateStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. You are not a student.' });
  }
  next();
};

// Middleware: Authorize admin role
const authenticateAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. You are not an admin.' });
  }
  next();
};

module.exports = { authenticate, authenticateStudent, authenticateAdmin };
