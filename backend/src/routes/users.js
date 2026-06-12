const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['manager']), usersController.getUsers);
router.get('/:id', authenticate, authorize(['manager']), usersController.getUser);
router.post('/', authenticate, authorize(['manager']), usersController.createUser);
router.put('/:id', authenticate, authorize(['manager']), usersController.updateUser);
router.delete('/:id', authenticate, authorize(['manager']), usersController.deleteUser);
router.put('/:id/reset-password', authenticate, authorize(['manager']), usersController.resetPassword);

module.exports = router;
