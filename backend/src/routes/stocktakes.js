const express = require('express');
const router = express.Router();
const stocktakesController = require('../controllers/stocktakesController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, stocktakesController.getStocktakes);
router.post('/', authenticate, authorize(['manager', 'stock']), stocktakesController.createStocktake);
router.post('/:id/count', authenticate, authorize(['manager', 'stock']), stocktakesController.recordCount);
router.put('/:id/commit', authenticate, authorize(['manager']), stocktakesController.commitStocktake);

module.exports = router;
