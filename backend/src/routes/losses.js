const express = require('express');
const router = express.Router();
const lossesController = require('../controllers/lossesController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['manager', 'stock']), lossesController.getLosses);
router.post('/', authenticate, authorize(['manager', 'stock']), lossesController.createLoss);

module.exports = router;
