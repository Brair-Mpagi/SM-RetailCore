const { body, query, param } = require('express-validator');

/**
 * Validation for user creation
 */
exports.createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Name must be 2-150 characters')
    .escape(),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be 8-100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['admin', 'manager', 'cashier', 'stock'])
    .withMessage('Valid role required (admin, manager, cashier, stock)'),
  
  body('device_id')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Device ID must be 3-100 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Device ID must contain only uppercase letters, numbers, and hyphens'),
];

/**
 * Validation for user update
 */
exports.updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID required'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Name must be 2-150 characters')
    .escape(),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'cashier', 'stock'])
    .withMessage('Valid role required'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean'),
];

/**
 * Validation for password reset
 */
exports.resetPasswordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID required'),
  
  body('new_password')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be 8-100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

/**
 * Validation for login
 */
exports.loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password required'),
];

/**
 * Validation for password reset request (forgot password)
 */
exports.forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
];

/**
 * Validation for password reset with PIN
 */
exports.resetPasswordWithPinValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  
  body('pin')
    .matches(/^\d{6}$/)
    .withMessage('PIN must be exactly 6 digits'),
  
  body('new_password')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be 8-100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];
