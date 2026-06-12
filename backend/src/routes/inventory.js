const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, inventoryController.getInventory);
router.get('/:productId', authenticate, inventoryController.getProductInventory);
router.post('/adjust', authenticate, authorize(['admin', 'manager', 'stock']), inventoryController.adjustStock);

module.exports = router;
