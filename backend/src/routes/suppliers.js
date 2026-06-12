const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', suppliersController.getSuppliers);
router.get('/:id', suppliersController.getSupplier);
router.post('/', suppliersController.createSupplier);
router.put('/:id', suppliersController.updateSupplier);
router.delete('/:id', suppliersController.deleteSupplier);

module.exports = router;
