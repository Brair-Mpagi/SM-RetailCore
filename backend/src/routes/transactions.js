const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, transactionsController.createSale);
router.get('/', authenticate, transactionsController.getTransactions);
router.get('/:id', authenticate, transactionsController.getTransaction);
router.get('/receipt/:receiptNumber', authenticate, transactionsController.getByReceiptNumber);
router.post('/:id/void', authenticate, authorize(['manager']), transactionsController.voidTransaction);

module.exports = router;
