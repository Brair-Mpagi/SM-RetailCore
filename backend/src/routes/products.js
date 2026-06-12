const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { authenticate, authorize } = require('../middleware/auth');

// Specific named routes BEFORE /:id to prevent matching conflicts
router.get('/next-barcode', authenticate, productsController.getNextBarcode);
router.post('/bulk', authenticate, authorize(['admin', 'manager', 'stock']), productsController.bulkCreateProducts);

router.get('/', authenticate, productsController.getProducts);
router.get('/:id', authenticate, productsController.getProduct);
router.post('/', authenticate, authorize(['admin', 'manager', 'stock']), productsController.createProduct);
router.put('/:id', authenticate, authorize(['admin', 'manager', 'stock']), productsController.updateProduct);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), productsController.deleteProduct);

module.exports = router;

