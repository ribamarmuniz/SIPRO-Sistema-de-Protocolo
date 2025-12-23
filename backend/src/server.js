const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

async function iniciarServidor() {
    // Inicializar banco de dados
    const db = require('./config/database');
    await db.aguardarInicializacao();
    console.log('✅ Banco de dados conectado!');

    // Rotas
    const authRoutes = require('./routes/authRoutes');
    const usuarioRoutes = require('./routes/usuarioRoutes');
    const setorRoutes = require('./routes/setorRoutes');
    const tipoDocumentoRoutes = require('./routes/tipoDocumentoRoutes');
    const protocoloRoutes = require('./routes/protocoloRoutes');
    const iaRoutes = require('./routes/iaRoutes');
    const relatorioRoutes = require('./routes/relatorioRoutes');
    const notificacaoRoutes = require('./routes/notificacaoRoutes');

    app.get('/', (req, res) => {
        res.json({ 
            mensagem: '🎉 API do Sistema de Protocolo UEMA funcionando!',
            versao: '1.0.0'
        });
    });

    app.use('/auth', authRoutes);
    app.use('/usuarios', usuarioRoutes);
    app.use('/setores', setorRoutes);
    app.use('/tipos-documento', tipoDocumentoRoutes);
    app.use('/protocolos', protocoloRoutes);
    app.use('/ia', iaRoutes);
    app.use('/relatorios', relatorioRoutes);
    app.use('/notificacoes', notificacaoRoutes);

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    });

    const PORT = 3000;
    app.listen(PORT, () => {
        console.log('=========================================');
        console.log('🚀 Servidor rodando!');
        console.log(`📡 Acesse: http://localhost:${PORT}`);
        console.log('=========================================');
    });
}

iniciarServidor().catch(console.error);