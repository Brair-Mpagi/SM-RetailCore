const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const {
  createSaleValidation,
  getTransactionsValidation,
  voidTransactionValidation,
  receiptNumberValidation
} = require('../validators/transaction');
const { transactionRateLimiter, voidRefundRateLimiter } = require('../middleware/rateLimiter');
const { transactionIdempotency } = require('../middleware/idempotency');

// Create sale transaction (with validation, rate limiting, and idempotency)
router.post('/', 
  authenticate,
  transactionRateLimiter,
  transactionIdempotency,
  createSaleValidation,
  validateRequest,
  transactionsController.createSale
);

// Get all transactions (with query validation)
router.get('/', 
  authenticate, 
  getTransactionsValidation,
  validateRequest,
  transactionsController.getTransactions
);

// Get single transaction by ID
router.get('/:id', 
  authenticate, 
  transactionsController.getTransaction
);

// Get transaction by receipt number (with format validation)
router.get('/receipt/:receiptNumber', 
  authenticate,
  receiptNumberValidation,
  validateRequest,
  transactionsController.getByReceiptNumber
);

// Void transaction (manager only, with validation and rate limiting)
router.post('/:id/void', 
  authenticate, 
  authorize(['manager']),
  voidRefundRateLimiter,
  voidTransactionValidation,
  validateRequest,
  transactionsController.voidTransaction
);

module.exports = router;


