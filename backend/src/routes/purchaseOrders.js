const express = require('express');
const router = express.Router();
const purchaseOrdersController = require('../controllers/purchaseOrdersController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, purchaseOrdersController.getPurchaseOrders);
router.get('/:id', authenticate, purchaseOrdersController.getPurchaseOrder);
router.post('/', authenticate, authorize(['manager', 'stock']), purchaseOrdersController.createPurchaseOrder);
router.put('/:id/receive', authenticate, authorize(['manager', 'stock']), purchaseOrdersController.receiveStock);

module.exports = router;
