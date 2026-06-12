const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize(['admin', 'manager']));

router.get('/', settingsController.getAllSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
