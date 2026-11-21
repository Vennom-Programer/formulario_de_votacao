const express = require('express');
const router = express.Router();

const {
    listarCriterios,
    criarAvaliacao
} = require('../controllers/avaliacaoController');
const { autenticar } = require('../middleware/autenticar');

router.get('/criterios', listarCriterios);
router.post('/', autenticar, criarAvaliacao);

module.exports = router;