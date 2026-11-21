
const crypto = require('crypto');
const db = require('../config/database');

function obterSegredo() {
    const segredo = process.env.AUTH_SECRET;

    if (!segredo || Buffer.byteLength(segredo) < 32) {
        throw new Error('AUTH_SECRET precisa ter pelo menos 32 bytes.');
    }

    return segredo;
}

function assinar(conteudo, segredo) {
    return crypto
        .createHmac('sha256', segredo)
        .update(conteudo)
        .digest('base64url');
}

function criarHash(valor) {
    return crypto
        .createHash('sha256')
        .update(valor)
        .digest('hex');
}

// Criar e armazenar sessão
async function criarToken(tipo, identificador) {
    console.log('[AUTH] Iniciando criação de sessão');
    console.log('[AUTH] Tipo:', tipo);
    console.log('[AUTH] Identificador:', identificador);

    const segredo = obterSegredo();

    const jti = crypto.randomUUID();
    const expiracao = Math.floor(Date.now() / 1000) + (60 * 60 * 8);

    const sub = crypto
        .createHmac('sha256', segredo)
        .update(`${tipo}:${identificador}`)
        .digest('hex');

    const payload = Buffer.from(JSON.stringify({
        sub,
        jti,
        exp: expiracao
    })).toString('base64url');

    const assinatura = assinar(payload, segredo);

    const token = `${payload}.${assinatura}`;

    // Armazena somente o hash do identificador da sessão
    console.log('[AUTH] Tentando salvar sessão no PostgreSQL');

    await db.query(
        `INSERT INTO sessoes (
            token_id_hash,
            tipo,
            identificador,
            expira_em
        )
        VALUES ($1, $2, $3, to_timestamp($4))`,
        [
            criarHash(jti),
            tipo,
            String(identificador),
            expiracao
        ]
    );

    console.log('[AUTH] Sessão salva com sucesso');

    return token;
}

// Validar sessão
async function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization || '';

    const correspondencia = cabecalho.match(
        /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/
    );

    if (!correspondencia) {
        return res.status(401).json({
            mensagem: 'Faça login para continuar.'
        });
    }

    try {
        const [payload, assinatura] = correspondencia[1].split('.');

        const assinaturaEsperada = assinar(
            payload,
            obterSegredo()
        );

        const recebida = Buffer.from(assinatura);
        const esperada = Buffer.from(assinaturaEsperada);

        if (
            recebida.length !== esperada.length ||
            !crypto.timingSafeEqual(recebida, esperada)
        ) {
            return res.status(401).json({
                mensagem: 'Sessão inválida. Faça login novamente.'
            });
        }

        let dados;

        try {
            dados = JSON.parse(
                Buffer.from(payload, 'base64url').toString('utf8')
            );
        } catch {
            return res.status(401).json({
                mensagem: 'Token inválido.'
            });
        }

        if (
            !dados.jti ||
            typeof dados.sub !== 'string' ||
            !Number.isInteger(dados.exp) ||
            dados.exp <= Math.floor(Date.now() / 1000)
        ) {
            return res.status(401).json({
                mensagem: 'Sua sessão expirou. Faça login novamente.'
            });
        }

        // Verifica se a sessão continua ativa no Aiven
        const resultado = await db.query(
            `SELECT tipo, identificador
             FROM sessoes
             WHERE token_id_hash = $1
               AND revogado = FALSE
               AND expira_em > NOW()`,
            [criarHash(dados.jti)]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensagem: 'Sessão inexistente ou revogada.'
            });
        }

        const sessao = resultado.rows[0];

        // Confirma se o usuário corresponde ao token
        const subEsperado = crypto
            .createHmac('sha256', obterSegredo())
            .update(`${sessao.tipo}:${sessao.identificador}`)
            .digest('hex');

        if (dados.sub !== subEsperado) {
            return res.status(401).json({
                mensagem: 'Sessão inválida.'
            });
        }

        req.usuario = {
            tipo: sessao.tipo,
            identificador: sessao.identificador
        };

        return next();

    } catch (erro) {
        console.error('Erro ao validar sessão:', erro.message);

        return res.status(503).json({
            mensagem: 'Não foi possível validar sua sessão.'
        });
    }
}

// Revogar sessão
async function revogarToken(token) {
    const partes = token.split('.');

    if (partes.length !== 2) {
        throw new Error('Token inválido.');
    }

    const dados = JSON.parse(
        Buffer.from(partes[0], 'base64url').toString('utf8')
    );

    if (!dados.jti) {
        throw new Error('Identificador de sessão inválido.');
    }

    await db.query(
        `UPDATE sessoes
         SET revogado = TRUE
         WHERE token_id_hash = $1`,
        [criarHash(dados.jti)]
    );
}

module.exports = {
    autenticar,
    criarToken,
    revogarToken
};
