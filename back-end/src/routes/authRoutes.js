const express = require('express');
const { cadastrar, entrar, verificarSessao } = require('../controllers/authController');
const { autenticar } = require('../middleware/autenticar');

const router = express.Router();

router.post('/cadastro', cadastrar);
router.post('/login', entrar);
router.get('/sessao', autenticar, verificarSessao);

module.exports = router;