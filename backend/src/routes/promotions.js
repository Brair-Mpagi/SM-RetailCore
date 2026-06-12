const express = require('express');
const router = express.Router();
const promotionsController = require('../controllers/promotionsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, promotionsController.getPromotions);
router.post('/', authenticate, authorize(['manager']), promotionsController.createPromotion);
router.put('/:id', authenticate, authorize(['manager']), promotionsController.updatePromotion);
router.delete('/:id', authenticate, authorize(['manager']), promotionsController.deletePromotion);

module.exports = router;
