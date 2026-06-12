const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided', 
        code: 401 
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user || !user.is_active || user.is_deleted) {
        return res.status(401).json({ 
          error: 'Invalid or expired token', 
          code: 401 
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Invalid token', 
        code: 401 
      });
    }
  } catch (error) {
    next(error);
  }
};

// Authorize based on roles
exports.authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        code: 401 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        code: 403 
      });
    }

    next();
  };
};

// Generate JWT token
exports.generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '8h' }
  );
};

// Generate refresh token
exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      type: 'refresh' 
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};
