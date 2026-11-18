const { body, query, param } = require('express-validator');

/**
 * Validation middleware for creating sales transactions
 * Prevents SQL injection, XSS, and business logic violations
 */
exports.createSaleValidation = [
  // Items validation
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID required'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Quantity must be between 1 and 10000'),
  
  body('items.*.unit_price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid unit price required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Unit price must be non-negative'),
  
  body('items.*.subtotal')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid subtotal required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Subtotal must be non-negative'),

  // Financial fields
  body('subtotal')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid subtotal required'),
  
  body('discount_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid discount amount required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Discount must be non-negative'),
  
  body('tax_amount')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid tax amount required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Tax amount must be non-negative'),
  
  body('total_amount')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid total amount required')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Total amount must be positive'),

  // Payment method
  body('payment_method')
    .isIn(['cash', 'mtn_momo', 'airtel_money'])
    .withMessage('Valid payment method required'),
  
  body('amount_tendered')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid amount tendered required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Amount tendered must be non-negative'),
  
  body('change_given')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid change amount required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Change given must be non-negative'),

  // Mobile money reference (required for mobile payments)
  body('momo_reference')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Mobile money reference must be 5-100 characters'),
  
  body('cash_session_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid cash session ID required'),
];

/**
 * Validation for fetching transactions list
 */
exports.getTransactionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('status')
    .optional()
    .isIn(['completed', 'voided', 'refunded'])
    .withMessage('Invalid status'),
  
  query('cashier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid cashier ID required'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Valid start date required (ISO 8601 format)'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Valid end date required (ISO 8601 format)'),
];

/**
 * Validation for void transaction
 */
exports.voidTransactionValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid transaction ID required'),
  
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Void reason must be 10-500 characters')
    .escape(), // Prevent XSS
];

/**
 * Validation for receipt lookup
 */
exports.receiptNumberValidation = [
  param('receiptNumber')
    .matches(/^REC-\d{8}-\d{4}$/)
    .withMessage('Invalid receipt number format (expected: REC-YYYYMMDD-NNNN)'),
];
