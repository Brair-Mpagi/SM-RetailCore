const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, alertsController.getAlerts);
router.post('/generate', authenticate, authorize(['manager', 'admin']), alertsController.generateAlerts);
router.put('/:id/read', authenticate, alertsController.markAsRead);
router.put('/read-all', authenticate, alertsController.markAllAsRead);
router.delete('/:id', authenticate, alertsController.deleteAlert);

module.exports = router;
