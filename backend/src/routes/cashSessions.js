const express = require('express');
const router = express.Router();
const cashSessionsController = require('../controllers/cashSessionsController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/',              authenticate, cashSessionsController.openSession);
router.post('/assign',        authenticate, authorize(['manager', 'admin']), cashSessionsController.assignSession);
router.get('/',               authenticate, cashSessionsController.getSessions);
router.get('/active',         authenticate, cashSessionsController.getActiveSession);
router.get('/all-active',     authenticate, authorize(['manager', 'admin']), cashSessionsController.getAllActiveSessions);
router.put('/:id/close',      authenticate, cashSessionsController.closeSession);
router.put('/:id/force-close', authenticate, authorize(['manager', 'admin']), cashSessionsController.forceCloseSession);

module.exports = router;
