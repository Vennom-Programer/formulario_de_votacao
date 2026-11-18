const express = require('express');
const router = express.Router();

const {
    listarProjetos,
    criarProjeto
} = require('../controllers/ProjetoController');

router.get('/', listarProjetos);
router.post('/', criarProjeto);

module.exports = router;