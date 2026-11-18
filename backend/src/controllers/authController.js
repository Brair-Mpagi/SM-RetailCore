const { User, AuditLog } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const redisService = require('../services/redis');
const logger = require('../utils/logger');

// Login with enhanced security
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required', 
        code: 400 
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      logger.logAuth('login_failed_user_not_found', { email, ip: req.ip });
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        code: 401 
      });
    }

    // Check if account is locked
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || 5);
    if (user.failed_attempts >= maxAttempts) {
      logger.logSecurity('login_attempt_locked_account', { 
        user_id: user.id,
        email,
        failed_attempts: user.failed_attempts,
        ip: req.ip 
      });
      return res.status(423).json({ 
        error: 'Account locked due to too many failed attempts. Please contact manager.', 
        code: 423 
      });
    }

    // Check if account is active
    if (!user.is_active || user.is_deleted) {
      logger.logSecurity('login_attempt_inactive_account', { 
        user_id: user.id,
        email,
        is_active: user.is_active,
        is_deleted: user.is_deleted,
        ip: req.ip 
      });
      return res.status(401).json({ 
        error: 'Account inactive. Please contact manager.', 
        code: 401 
      });
    }

    // Validate password
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      // Increment failed attempts
      const newFailedAttempts = user.failed_attempts + 1;
      await user.update({ failed_attempts: newFailedAttempts });

      // Log failed attempt
      logger.logAuth('login_failed_invalid_password', { 
        user_id: user.id,
        email,
        failed_attempts: newFailedAttempts,
        ip: req.ip 
      });

      await AuditLog.create({
        user_id: user.id,
        action: 'login_failed',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: req.ip,
        meta: { email, reason: 'invalid_password' }
      });

      // Warn if approaching lockout
      const remainingAttempts = maxAttempts - newFailedAttempts;
      if (remainingAttempts > 0 && remainingAttempts <= 2) {
        return res.status(401).json({ 
          error: 'Invalid credentials', 
          code: 401,
          remaining_attempts: remainingAttempts,
          warning: `Account will be locked after ${remainingAttempts} more failed attempt(s)`
        });
      }

      return res.status(401).json({ 
        error: 'Invalid credentials', 
        code: 401 
      });
    }

    // Reset failed attempts on successful login
    await user.update({ failed_attempts: 0 });

    // Generate session ID
    const sessionId = `session_${user.id}_${Date.now()}`;

    // Generate tokens with session tracking
    const token = generateToken(user, sessionId);
    const refreshToken = generateRefreshToken(user, sessionId);

    // Track tokens in Redis for revocation capability
    await redisService.trackUserToken(user.id, token, 8 * 60 * 60); // 8 hours

    // Log successful login
    logger.logAuth('login_success', { 
      user_id: user.id,
      email: user.email,
      role: user.role,
      session_id: sessionId,
      ip: req.ip 
    });

    await AuditLog.create({
      user_id: user.id,
      action: 'login_success',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip,
      meta: { session_id: sessionId }
    });

    res.json({
      data: {
        user: user.toJSON(),
        token,
        refreshToken,
        expires_in: 28800, // 8 hours in seconds
        token_type: 'Bearer'
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// Logout with token revocation
exports.logout = async (req, res, next) => {
  try {
    const token = req.token; // Set by authenticate middleware

    // Revoke access token
    if (token) {
      await redisService.revokeToken(token, 8 * 60 * 60); // 8 hours
    }

    // Revoke refresh token if provided
    const { refresh_token } = req.body;
    if (refresh_token) {
      await redisService.revokeToken(refresh_token, 7 * 24 * 60 * 60); // 7 days
    }

    logger.logAuth('logout', { 
      user_id: req.user.id,
      ip: req.ip 
    });

    // Log logout
    await AuditLog.create({
      user_id: req.user.id,
      action: 'logout',
      entity_type: 'user',
      entity_id: req.user.id,
      ip_address: req.ip
    });

    res.json({ 
      data: { message: 'Logged out successfully' } 
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.me = async (req, res, next) => {
  try {
    res.json({ 
      data: req.user.toJSON() 
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password — Manager only (LAN system: returns PIN directly)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required', code: 400 });
    }

    const user = await User.findOne({ where: { email, is_deleted: 0 } });

    // Always return 200 to prevent email enumeration, but only process managers
    if (!user || user.role !== 'manager') {
      return res.status(200).json({
        data: {
          success: false,
          message: 'If a manager account exists with that email, a PIN has been generated.'
        }
      });
    }

    // Generate a 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store hashed PIN
    const bcrypt = require('bcryptjs');
    const pinHash = await bcrypt.hash(pin, 8);

    await user.update({
      reset_pin: pinHash,
      reset_pin_expires_at: expires
    });

    // On a LAN system with no email server, return PIN in response
    // The manager reads it directly and uses it to reset their password
    return res.status(200).json({
      data: {
        success: true,
        pin,  // LAN-only: shown directly to the manager
        expires_at: expires,
        message: 'PIN generated. Use it within 15 minutes to reset your password.'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password with PIN — Manager only
exports.resetPasswordWithPin = async (req, res, next) => {
  try {
    const { email, pin, new_password } = req.body;

    if (!email || !pin || !new_password) {
      return res.status(400).json({ error: 'Email, PIN, and new password are required', code: 400 });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters', code: 400 });
    }

    const user = await User.findOne({ where: { email, role: 'manager', is_deleted: 0 } });

    if (!user || !user.reset_pin || !user.reset_pin_expires_at) {
      return res.status(400).json({ error: 'Invalid or expired PIN. Please request a new one.', code: 400 });
    }

    // Check expiry
    if (new Date() > new Date(user.reset_pin_expires_at)) {
      await user.update({ reset_pin: null, reset_pin_expires_at: null });
      return res.status(400).json({ error: 'PIN has expired. Please request a new one.', code: 400 });
    }

    // Validate PIN
    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(pin, user.reset_pin);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid PIN.', code: 400 });
    }

    // Update password and clear PIN
    const password_hash = await User.hashPassword(new_password);
    await user.update({
      password_hash,
      reset_pin: null,
      reset_pin_expires_at: null,
      failed_attempts: 0
    });

    return res.status(200).json({
      data: { message: 'Password reset successfully. You can now log in.' }
    });
  } catch (error) {
    next(error);
  }
};
