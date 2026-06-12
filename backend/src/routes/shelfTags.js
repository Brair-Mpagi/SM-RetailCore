const express = require('express');
const router = express.Router();
const c = require('../controllers/shelfTagsController');
const { authenticate, authorize } = require('../middleware/auth');

const mgr = ['admin', 'manager', 'stock'];

router.get('/', authenticate, c.getAll);
router.get('/:id', authenticate, c.getOne);
router.post('/', authenticate, authorize(mgr), c.create);
router.put('/:id', authenticate, authorize(mgr), c.update);
router.delete('/:id', authenticate, authorize(mgr), c.remove);

module.exports = router;
