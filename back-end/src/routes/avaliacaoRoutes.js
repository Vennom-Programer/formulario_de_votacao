const express = require('express');
const router = express.Router();

const {
    listarCriterios,
    criarAvaliacao
} = require('../controllers/avaliacaoController');

router.get('/criterios', listarCriterios);
router.post('/', criarAvaliacao);

module.exports = router;