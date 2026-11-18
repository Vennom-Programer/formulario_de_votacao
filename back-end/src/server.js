
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const statusRoutes = require('./routes/StatusRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const projetoRoutes = require('./routes/ProjetoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

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

// Rotas de status
app.use('/api/status', statusRoutes);
// Rotas de projeto
app.use('/api/projetos', projetoRoutes);
// Rotas de avaliação
app.use('/api/avaliacoes', avaliacaoRoutes);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
