const db = require('../config/database');

async function verificarStatus(req, res) {
    try {
        await db.query('SELECT 1');

        return res.json({
            aplicacao: 'ok',
            banco: 'ok'
        });
    } catch (erro) {
        console.error('Erro ao verificar banco:', erro.message);

        return res.status(503).json({
            aplicacao: 'ok',
            banco: 'erro',
            mensagem: 'Não foi possível conectar ao banco de dados.'
        });
    }
}

module.exports = {
    verificarStatus
};