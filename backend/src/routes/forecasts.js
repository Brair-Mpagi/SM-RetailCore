const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.status(501).json({ error: 'Not implemented yet', code: 501 }));

module.exports = router;
