const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const { authenticate } = require('../middleware/auth');

// Public route for webhook callbacks (called by Pesapal servers)
// Supports both GET and POST webhooks
router.get('/webhook', paymentsController.webhookHandler);
router.post('/webhook', paymentsController.webhookHandler);

// Protected routes for cashier/admin POS terminals
router.post('/initiate', authenticate, paymentsController.initiatePayment);
router.get('/status/:reference', authenticate, paymentsController.pollPaymentStatus);

module.exports = router;
