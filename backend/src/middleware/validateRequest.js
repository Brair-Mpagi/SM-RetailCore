const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors from express-validator
 * Returns a 400 response with detailed validation error messages
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      error: 'Validation failed',
      code: 400,
      details: extractedErrors
    });
  }
  
  next();
};
