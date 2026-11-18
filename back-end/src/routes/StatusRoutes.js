const express = require('express');
const router = express.Router();

const { verificarStatus } = require('../controllers/statusController');

router.get('/', verificarStatus);

module.exports = router;