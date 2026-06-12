const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { authenticate, authorize } = require('../middleware/auth');

const managerOnly = [authenticate, authorize(['manager', 'admin'])];
const analystAccess = [authenticate, authorize(['manager', 'admin', 'stock'])];

router.get('/overview',                  ...managerOnly,   managerController.getOperationsOverview);
router.get('/cashier-perf',              ...managerOnly,   managerController.getCashierPerformance);
router.get('/shift-breakdowns',          ...managerOnly,   managerController.getShiftBreakdowns);
router.get('/recent-txns',               ...managerOnly,   managerController.getRecentTransactions);
router.get('/product-analytics/:id',     ...analystAccess, managerController.getProductAnalytics);

module.exports = router;

