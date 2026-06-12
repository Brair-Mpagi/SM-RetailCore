const express = require('express');
const router = express.Router();
const purchaseRequestsController = require('../controllers/purchaseRequestsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['admin', 'manager', 'stock']), purchaseRequestsController.getPurchaseRequests);
router.get('/:id', authenticate, authorize(['admin', 'manager', 'stock']), purchaseRequestsController.getPurchaseRequest);
router.post('/', authenticate, authorize(['manager', 'stock']), purchaseRequestsController.createPurchaseRequest);
router.put('/:id/status', authenticate, authorize(['admin', 'manager']), purchaseRequestsController.updateRequestStatus);
router.delete('/:id', authenticate, authorize(['admin', 'manager', 'stock']), purchaseRequestsController.deletePurchaseRequest);

module.exports = router;
