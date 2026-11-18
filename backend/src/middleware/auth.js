const jwt = require('jsonwebtoken');
const { User } = require('../models');
const redisService = require('../services/redis');
const logger = require('../utils/logger');

// Authenticate JWT token with revocation check
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
      // Check if token is revoked (Redis check)
      const isRevoked = await redisService.isTokenRevoked(token);
      if (isRevoked) {
        logger.logSecurity('revoked_token_used', { 
          token_preview: token.substring(0, 20),
          ip: req.ip 
        });
        return res.status(401).json({ 
          error: 'Token has been revoked', 
          code: 401 
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify it's an access token (not refresh token)
      if (decoded.type === 'refresh') {
        return res.status(401).json({ 
          error: 'Invalid token type', 
          code: 401 
        });
      }

      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user || !user.is_active || user.is_deleted) {
        logger.logSecurity('inactive_user_token_used', { 
          user_id: decoded.id,
          ip: req.ip 
        });
        return res.status(401).json({ 
          error: 'Invalid or expired token', 
          code: 401 
        });
      }

      req.user = user;
      req.token = token; // Store token for potential revocation
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired', 
          code: 401,
          expired: true 
        });
      }
      
      logger.logSecurity('invalid_token_attempt', { 
        error: jwtError.message,
        ip: req.ip 
      });
      
      return res.status(401).json({ 
        error: 'Invalid token', 
        code: 401 
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
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

// Generate access token
exports.generateToken = (user, sessionId = null) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      type: 'access',
      ...(sessionId && { sid: sessionId })
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '8h' }
  );
};

// Generate refresh token with rotation support
exports.generateRefreshToken = (user, sessionId) => {
  return jwt.sign(
    { 
      id: user.id, 
      type: 'refresh',
      sid: sessionId,
      // Add version for token rotation
      ver: Date.now()
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

// Verify refresh token
exports.verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Check if refresh token is revoked
    const isRevoked = await redisService.isTokenRevoked(refreshToken);
    if (isRevoked) {
      throw new Error('Refresh token revoked');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

// Refresh access token (with refresh token rotation)
exports.refreshAccessToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ 
        error: 'Refresh token required', 
        code: 400 
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = await exports.verifyRefreshToken(refresh_token);
    } catch (error) {
      logger.logSecurity('invalid_refresh_token', { 
        error: error.message,
        ip: req.ip 
      });
      return res.status(401).json({ 
        error: 'Invalid refresh token', 
        code: 401 
      });
    }
    
    // Get user
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user || !user.is_active || user.is_deleted) {
      return res.status(401).json({ 
        error: 'User not found or inactive', 
        code: 401 
      });
    }
    
    // Generate new tokens (rotate refresh token)
    const sessionId = decoded.sid || `session_${user.id}_${Date.now()}`;
    const newAccessToken = exports.generateToken(user, sessionId);
    const newRefreshToken = exports.generateRefreshToken(user, sessionId);
    
    // Revoke old refresh token (prevent reuse)
    await redisService.revokeToken(refresh_token, 7 * 24 * 60 * 60); // 7 days
    
    // Track new access token for potential revocation
    await redisService.trackUserToken(user.id, newAccessToken, 8 * 60 * 60); // 8 hours
    
    logger.logAuth('token_refreshed', { 
      user_id: user.id,
      ip: req.ip 
    });
    
    res.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 28800, // 8 hours in seconds
      token_type: 'Bearer',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
};
