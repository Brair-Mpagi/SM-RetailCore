const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['manager', 'cashier']), returnsController.createReturn);
router.get('/', authenticate, returnsController.getReturns);

module.exports = router;
