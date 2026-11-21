
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const statusRoutes = require('./routes/StatusRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const projetoRoutes = require('./routes/ProjetoRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Rota de teste
app.get('/', async (req, res) => {
    try {
        await db.query('SELECT NOW()');

        res.json({
            mensagem: 'Servidor e PostgreSQL conectados!'
        });

    } catch (erro) {
        console.error('Erro na conexão:', erro.message);

        res.status(500).json({
            mensagem: 'Erro ao conectar com o banco'
        });
    }
});

// Rotas de avaliação
app.use('/api/avaliacoes', avaliacaoRoutes);
// Rotas de status
app.use('/api/status', statusRoutes);
// Rotas de projeto
app.use('/api/projetos', projetoRoutes);

// Inicialização local
if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

// Exportação para a Vercel
module.exports = app;
