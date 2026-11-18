const db = require('../config/database');

async function listarProjetos(req, res) {
    try {
        const resultado = await db.query(
            'SELECT id_projeto, nome, descricao FROM projetos ORDER BY id_projeto'
        );

        return res.json({
            projetos: resultado.rows
        });
    } catch (erro) {
        console.error('Erro ao listar projetos:', erro.message);

        return res.status(500).json({
            mensagem: 'Não foi possível carregar os projetos.'
        });
    }
}

async function criarProjeto(req, res) {
    const { nome, descricao } = req.body;

    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).json({
            mensagem: 'O nome do projeto é obrigatório.'
        });
    }

    try {
        const resultado = await db.query(
            `INSERT INTO projetos (nome, descricao)
             VALUES ($1, $2)
             RETURNING id_projeto, nome, descricao`,
            [nome.trim(), descricao ? String(descricao).trim() : null]
        );

        return res.status(201).json({
            mensagem: 'Projeto cadastrado com sucesso!',
            projeto: resultado.rows[0]
        });
    } catch (erro) {
        console.error('Erro ao cadastrar projeto:', erro.message);

        return res.status(500).json({
            mensagem: 'Não foi possível cadastrar o projeto.'
        });
    }
}

module.exports = {
    listarProjetos,
    criarProjeto
};