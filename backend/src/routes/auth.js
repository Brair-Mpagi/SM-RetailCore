const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, refreshAccessToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { loginValidation, forgotPasswordValidation, resetPasswordWithPinValidation } = require('../validators/user');
const { loginRateLimiter, passwordResetRateLimiter } = require('../middleware/rateLimiter');

// Login with rate limiting and validation
router.post('/login', 
  loginRateLimiter,
  loginValidation,
  validateRequest,
  authController.login
);

// Logout (revoke tokens)
router.post('/logout', 
  authenticate, 
  authController.logout
);

// Refresh access token
router.post('/refresh',
  refreshAccessToken
);

// Get current user
router.get('/me', 
  authenticate, 
  authController.me
);

// Forgot password with rate limiting
router.post('/forgot-password', 
  passwordResetRateLimiter,
  forgotPasswordValidation,
  validateRequest,
  authController.forgotPassword
);

// Reset password with PIN
router.post('/reset-password-pin', 
  passwordResetRateLimiter,
  resetPasswordWithPinValidation,
  validateRequest,
  authController.resetPasswordWithPin
);

module.exports = router;

