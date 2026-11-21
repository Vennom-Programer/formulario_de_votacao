const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function executarMigracao() {
    const arquivo = path.join(__dirname, '../src/sql/001_autenticacao.sql');
    const sql = fs.readFileSync(arquivo, 'utf8');

    try {
        await db.query(sql);
        console.log('Migração de autenticação aplicada com sucesso.');
    } catch (erro) {
        console.error('Erro ao aplicar migração de autenticação:', erro.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

executarMigracao();