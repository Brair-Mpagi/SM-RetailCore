const { User, AuditLog } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

// Login
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
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        code: 401 
      });
    }

    // Check if account is locked
    if (user.failed_attempts >= parseInt(process.env.MAX_LOGIN_ATTEMPTS || 5)) {
      return res.status(423).json({ 
        error: 'Account locked. Please see manager.', 
        code: 423 
      });
    }

    // Check if account is active
    if (!user.is_active || user.is_deleted) {
      return res.status(401).json({ 
        error: 'Account locked. Please see manager.', 
        code: 401 
      });
    }

    // Validate password
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      // Increment failed attempts
      await user.update({ 
        failed_attempts: user.failed_attempts + 1 
      });

      // Log failed attempt
      await AuditLog.create({
        user_id: user.id,
        action: 'login_failed',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: req.ip,
        meta: { email }
      });

      return res.status(401).json({ 
        error: 'Invalid credentials', 
        code: 401 
      });
    }

    // Reset failed attempts on successful login
    await user.update({ failed_attempts: 0 });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log successful login
    await AuditLog.create({
      user_id: user.id,
      action: 'login_success',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip
    });

    res.json({
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
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
