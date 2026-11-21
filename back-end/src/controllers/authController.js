const crypto = require('crypto');
const { promisify } = require('util');
const db = require('../config/database');
const { criarToken } = require('../middleware/autenticar');

const scrypt = promisify(crypto.scrypt);
const MAX_MATRICULA = 2147483647;
const HASH_SENHA_INEXISTENTE = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;

function validarCpf(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const calcularDigito = (base, pesoInicial) => {
        const soma = [...base].reduce(
            (total, digito, indice) => total + Number(digito) * (pesoInicial - indice),
            0
        );
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    return (
        calcularDigito(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
        calcularDigito(cpf.slice(0, 10), 11) === Number(cpf[10])
    );
}

function normalizarEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validarIdentificador(tipo, valor) {
    if (tipo === 'visitante') {
        const cpf = typeof valor === 'string' ? valor.replace(/\D/g, '') : '';
        return validarCpf(cpf) ? cpf : null;
    }

    if (tipo === 'aluno') {
        const matricula = typeof valor === 'string' ? valor.trim() : '';

        if (!/^\d{1,10}$/.test(matricula)) {
            return null;
        }

        const numero = Number(matricula);
        return Number.isInteger(numero) && numero > 0 && numero <= MAX_MATRICULA
            ? String(numero)
            : null;
    }

    return null;
}

function validarEmail(email) {
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function gerarHash(senha) {
    const sal = crypto.randomBytes(16).toString('hex');
    const hash = await scrypt(senha, sal, 64);
    return `scrypt$${sal}$${hash.toString('hex')}`;
}

async function verificarSenha(senha, senhaArmazenada) {
    const partes = typeof senhaArmazenada === 'string' ? senhaArmazenada.split('$') : [];

    if (
        partes.length === 3 &&
        partes[0] === 'scrypt' &&
        /^[a-f\d]{32}$/.test(partes[1]) &&
        /^[a-f\d]{128}$/.test(partes[2])
    ) {
        const hashEsperado = Buffer.from(partes[2], 'hex');
        const hashRecebido = await scrypt(senha, partes[1], hashEsperado.length);
        return crypto.timingSafeEqual(hashRecebido, hashEsperado);
    }

    if (typeof senhaArmazenada !== 'string') {
        return false;
    }

    const senhaRecebida = Buffer.from(senha);
    const senhaLegada = Buffer.from(senhaArmazenada);
    return senhaRecebida.length === senhaLegada.length &&
        crypto.timingSafeEqual(senhaRecebida, senhaLegada);
}

function senhaEstaHasheada(senha) {
    return typeof senha === 'string' &&
        /^scrypt\$[a-f\d]{32}\$[a-f\d]{128}$/.test(senha);
}

function tipoDeConflito(erro) {
    if (erro.constraint === 'usuario_email_unique') {
        return 'Este e-mail já está cadastrado.';
    }
    if (erro.constraint === 'usuario_cpf_unique') {
        return 'Este CPF já está cadastrado.';
    }
    if (erro.constraint === 'usuario_matricula_unique') {
        return 'Esta matrícula já está cadastrada.';
    }
    return 'Já existe um cadastro com esses dados.';
}

async function cadastrar(req, res) {
    const body = req.body || {};
    const { tipo, nome, email, senha, confirmarSenha } = body;
    const identificadorInformado = tipo === 'visitante' ? body.cpf : body.matricula;
    const identificador = validarIdentificador(tipo, identificadorInformado);
    const nomeNormalizado = typeof nome === 'string' ? nome.trim() : '';
    const emailNormalizado = normalizarEmail(email);

    if (!identificador) {
        return res.status(400).json({
            mensagem: tipo === 'visitante'
                ? 'Informe um CPF válido.'
                : 'Informe uma matrícula válida.'
        });
    }

    if (nomeNormalizado.length < 2 || nomeNormalizado.length > 120) {
        return res.status(400).json({ mensagem: 'Informe seu nome (de 2 a 120 caracteres).' });
    }

    if (!validarEmail(emailNormalizado)) {
        return res.status(400).json({ mensagem: 'Informe um e-mail válido.' });
    }

    if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128) {
        return res.status(400).json({ mensagem: 'A senha deve ter entre 8 e 128 caracteres.' });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).json({ mensagem: 'As senhas não conferem.' });
    }

    try {
        const senhaHash = await gerarHash(senha);
        const resultado = tipo === 'visitante'
            ? await db.query(
                `INSERT INTO usuario (nome, email, senha, cpf, matricula)
                 VALUES ($1, $2, $3, $4, NULL)
                 RETURNING nome, email`,
                [nomeNormalizado, emailNormalizado, senhaHash, identificador]
            )
            : await db.query(
                `INSERT INTO usuario (nome, email, senha, cpf, matricula)
                 VALUES ($1, $2, $3, NULL, $4)
                 RETURNING nome, email`,
                [nomeNormalizado, emailNormalizado, senhaHash, Number(identificador)]
            );

        return res.status(201).json({
            mensagem: 'Cadastro realizado. Entre com seus dados para continuar.',
            usuario: resultado.rows[0]
        });
    } catch (erro) {
        if (erro.code === '23505') {
            return res.status(409).json({ mensagem: tipoDeConflito(erro) });
        }

        console.error('Erro ao cadastrar usuário:', erro.message);
        return res.status(500).json({ mensagem: 'Não foi possível concluir o cadastro.' });
    }
}

async function entrar(req, res) {
    const body = req.body || {};
    const { tipo, senha } = body;
    const identificadorInformado = tipo === 'visitante' ? body.cpf : body.matricula;
    const identificador = validarIdentificador(tipo, identificadorInformado);
    let etapa = 'validar dados de acesso';

    if (!identificador || typeof senha !== 'string' || senha.length === 0) {
        return res.status(400).json({ mensagem: 'Informe seus dados de acesso.' });
    }

    try {
        etapa = 'buscar usuário';
        const resultado = tipo === 'visitante'
            ? await db.query(
                'SELECT nome, email, senha FROM usuario WHERE cpf = $1',
                [identificador]
            )
            : await db.query(
                'SELECT nome, email, senha FROM usuario WHERE matricula = $1',
                [Number(identificador)]
            );

        const usuario = resultado.rows[0];
        etapa = 'verificar senha';
        const senhaValida = usuario
            ? await verificarSenha(senha, usuario.senha)
            : await verificarSenha(senha, HASH_SENHA_INEXISTENTE);

        if (!senhaValida) {
            return res.status(401).json({ mensagem: 'Dados de acesso inválidos.' });
        }

        if (!senhaEstaHasheada(usuario.senha)) {
            etapa = 'atualizar hash da senha';
            const senhaHash = await gerarHash(senha);
            const coluna = tipo === 'visitante' ? 'cpf' : 'matricula';
            await db.query(
                `UPDATE usuario SET senha = $1 WHERE ${coluna} = $2`,
                [senhaHash, tipo === 'visitante' ? identificador : Number(identificador)]
            );
        }

        etapa = 'criar sessão';
        const token = await criarToken(tipo, identificador);

        return res.json({
            mensagem: 'Login realizado com sucesso.',
            token,
            usuario: {
                nome: usuario.nome,
                email: usuario.email,
                tipo
            }
        });
    } catch (erro) {
        console.error('Erro ao autenticar usuário:', {
            etapa,
            codigo: erro.code || 'SEM_CODIGO',
            mensagem: erro.message
        });
        return res.status(500).json({ mensagem: 'Não foi possível realizar o login.' });
    }
}

function verificarSessao(req, res) {
    return res.json({ autenticado: true });
}

module.exports = {
    cadastrar,
    entrar,
    verificarSessao
};