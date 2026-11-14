const express = require('express');
const router = express.Router();

const {
    criarAvaliacao
} = require('../controllers/avaliacaoController');

router.post('/', criarAvaliacao);

module.exports = router;