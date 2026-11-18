const { body, query, param } = require('express-validator');

/**
 * Validation for creating products
 */
exports.createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be 2-200 characters')
    .escape(),
  
  body('sku')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('SKU must be 2-100 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),
  
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 8, max: 100 })
    .withMessage('Barcode must be 8-100 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Barcode must contain only numbers'),
  
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID required'),
  
  body('unit_price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid unit price required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Unit price must be non-negative'),
  
  body('cost_price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid cost price required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Cost price must be non-negative'),
  
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid supplier ID required'),
  
  body('reorder_point')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Reorder point must be between 0 and 100000'),
  
  body('unit_of_measure')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Unit of measure must be 1-30 characters')
    .escape(),
  
  body('expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Valid expiry date required (ISO 8601 format)'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be 1-100 characters')
    .escape(),
];

/**
 * Validation for updating products
 */
exports.updateProductValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID required'),
  
  ...exports.createProductValidation,
];

/**
 * Validation for product listing
 */
exports.getProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid category ID required'),
  
  query('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid supplier ID required'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be 1-200 characters')
    .escape(),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean'),
];

/**
 * Validation for bulk product creation
 */
exports.bulkCreateValidation = [
  body('products')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Products array must contain 1-1000 items'),
  
  body('products.*.name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be 2-200 characters'),
  
  body('products.*.sku')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('SKU must be 2-100 characters'),
  
  body('products.*.unit_price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid unit price required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Unit price must be non-negative'),
  
  body('products.*.cost_price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid cost price required')
    .custom((value) => parseFloat(value) >= 0)
    .withMessage('Cost price must be non-negative'),
];
