const crypto = require('crypto');

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

function criarToken(tipo, identificador) {
    const segredo = obterSegredo();
    const payload = Buffer.from(JSON.stringify({
        sub: crypto
            .createHmac('sha256', segredo)
            .update(`${tipo}:${identificador}`)
            .digest('hex'),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    })).toString('base64url');
    const assinatura = assinar(payload, segredo);

    return `${payload}.${assinatura}`;
}

function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization || '';
    const correspondencia = cabecalho.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);

    if (!correspondencia) {
        return res.status(401).json({ mensagem: 'Faça login para continuar.' });
    }

    try {
        const [payload, assinatura] = correspondencia[1].split('.');
        const assinaturaEsperada = assinar(payload, obterSegredo());
        const recebida = Buffer.from(assinatura);
        const esperada = Buffer.from(assinaturaEsperada);

        if (
            recebida.length !== esperada.length ||
            !crypto.timingSafeEqual(recebida, esperada)
        ) {
            return res.status(401).json({ mensagem: 'Sessão inválida. Faça login novamente.' });
        }

        const dados = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

        if (!Number.isInteger(dados.exp) || dados.exp <= Math.floor(Date.now() / 1000)) {
            return res.status(401).json({ mensagem: 'Sua sessão expirou. Faça login novamente.' });
        }

        return next();
    } catch (erro) {
        console.error('Erro ao validar sessão:', erro.message);
        return res.status(503).json({ mensagem: 'Não foi possível validar sua sessão.' });
    }
}

module.exports = {
    autenticar,
    criarToken
};