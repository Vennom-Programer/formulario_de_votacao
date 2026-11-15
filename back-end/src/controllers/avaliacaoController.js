
const db = require('../config/database');

async function listarCriterios(req, res) {
    try {
        const resultado = await db.query(
            'SELECT id_criterio FROM criterios ORDER BY id_criterio'
        );

        return res.json({
            criterios: resultado.rows.map(criterio => Number(criterio.id_criterio))
        });
    } catch (erro) {
        console.error('Erro ao buscar critérios:', erro.message);

        return res.status(500).json({
            mensagem: 'Não foi possível carregar os critérios.'
        });
    }
}

async function criarAvaliacao(req, res) {
    const { codigo, id_projeto, notas } = req.body;

    // 1. Validar os dados recebidos
    if (!codigo || !Number.isInteger(id_projeto) || id_projeto <= 0) {
        return res.status(400).json({
            mensagem: 'Código e projeto são obrigatórios.'
        });
    }

    if (!Array.isArray(notas) || notas.length !== 6) {
        return res.status(400).json({
            mensagem: 'A avaliação precisa conter seis notas.'
        });
    }

    // 2. Verificar se as seis notas são válidas
    const criteriosRecebidos = new Set();

    for (const nota of notas) {
        if (
            !Number.isInteger(nota.id_criterio) ||
            nota.id_criterio <= 0 ||
            typeof nota.valor !== 'number' ||
            !Number.isFinite(nota.valor) ||
            nota.valor < 0 ||
            nota.valor > 10 ||
            criteriosRecebidos.has(nota.id_criterio)
        ) {
            return res.status(400).json({
                mensagem: 'Existem notas inválidas ou critérios repetidos.'
            });
        }

        criteriosRecebidos.add(nota.id_criterio);
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 3. Buscar o avaliador pelo código
        const avaliador = await client.query(
            `SELECT id_avaliador
             FROM avaliadores
             WHERE codigo = $1 AND ativo = TRUE`,
            [codigo.trim()]
        );

        if (avaliador.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(403).json({
                mensagem: 'Código inválido ou inativo.'
            });
        }

        // 4. Conferir se o projeto existe
        const projeto = await client.query(
            'SELECT id_projeto FROM projetos WHERE id_projeto = $1',
            [id_projeto]
        );

        if (projeto.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                mensagem: 'Projeto não encontrado.'
            });
        }

        // 5. Conferir se foram enviados os seis critérios cadastrados
        const criterios = await client.query(
            'SELECT id_criterio FROM criterios'
        );

        const idsCadastrados = new Set(
            criterios.rows.map(c => c.id_criterio)
        );

        if (
            idsCadastrados.size !== 6 ||
            !notas.every(n => idsCadastrados.has(n.id_criterio))
        ) {
            await client.query('ROLLBACK');

            return res.status(500).json({
                mensagem: 'Configuração dos critérios inválida.'
            });
        }

        // 6. Criar a avaliação
        const novaAvaliacao = await client.query(
            `INSERT INTO avaliacoes (id_avaliador, id_projeto)
             VALUES ($1, $2)
             RETURNING id_avaliacao`,
            [avaliador.rows[0].id_avaliador, id_projeto]
        );

        const id_avaliacao = novaAvaliacao.rows[0].id_avaliacao;

        // 7. Registrar as seis notas
        for (const nota of notas) {
            await client.query(
                `INSERT INTO notas
                 (id_avaliacao, id_criterio, valor)
                 VALUES ($1, $2, $3)`,
                [id_avaliacao, nota.id_criterio, nota.valor]
            );
        }

        // 8. Confirmar tudo no banco
        await client.query('COMMIT');

        return res.status(201).json({
            mensagem: 'Avaliação registrada com sucesso!',
            id_avaliacao
        });

    } catch (erro) {
        await client.query('ROLLBACK');

        if (erro.code === '23505') {
            return res.status(409).json({
                mensagem: 'Você já avaliou este projeto.'
            });
        }

        console.error('Erro ao registrar avaliação:', erro.message);

        return res.status(500).json({
            mensagem: 'Não foi possível registrar a avaliação.'
        });

    } finally {
        client.release();
    }
}

module.exports = {
    listarCriterios,
    criarAvaliacao
};
