const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/daily', authenticate, authorize(['manager']), reportsController.getDailySalesReport);
router.get('/shift/:sessionId', authenticate, reportsController.getShiftReport);
router.get('/inventory', authenticate, authorize(['manager', 'stock']), reportsController.getInventoryReport);
router.get('/loss', authenticate, authorize(['manager']), reportsController.getLossReport);

module.exports = router;
