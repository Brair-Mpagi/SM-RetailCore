const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', categoriesController.getCategories);
router.get('/:id', categoriesController.getCategory);
router.post('/', categoriesController.createCategory);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;
