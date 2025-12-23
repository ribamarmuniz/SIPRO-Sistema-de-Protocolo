const db = require('./database');

async function criarTabelas() {
    await db.aguardarInicializacao();

    console.log('📦 Criando tabelas...');

    // Criar tabela de Setores
    db.exec(`
        CREATE TABLE IF NOT EXISTS setores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            sigla TEXT NOT NULL UNIQUE,
            descricao TEXT,
            ativo INTEGER DEFAULT 1,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Criar tabela de Usuários
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            perfil TEXT NOT NULL,
            setor_id INTEGER,
            ativo INTEGER DEFAULT 1,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (setor_id) REFERENCES setores(id)
        )
    `);

    // Criar tabela de Tipos de Documento
    db.exec(`
        CREATE TABLE IF NOT EXISTS tipos_documento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            descricao TEXT,
            prazo_padrao INTEGER DEFAULT 30,
            ativo INTEGER DEFAULT 1
        )
    `);

    // Criar tabela de Protocolos
    db.exec(`
        CREATE TABLE IF NOT EXISTS protocolos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_protocolo TEXT NOT NULL UNIQUE,
            tipo_documento_id INTEGER NOT NULL,
            assunto TEXT NOT NULL,
            descricao TEXT,
            arquivo_url TEXT,
            remetente_id INTEGER NOT NULL,
            setor_origem_id INTEGER NOT NULL,
            setor_destino_id INTEGER NOT NULL,
            status TEXT DEFAULT 'aguardando',
            recebido_em TEXT,
            recebido_por_id INTEGER,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
            FOREIGN KEY (remetente_id) REFERENCES usuarios(id),
            FOREIGN KEY (setor_origem_id) REFERENCES setores(id),
            FOREIGN KEY (setor_destino_id) REFERENCES setores(id),
            FOREIGN KEY (recebido_por_id) REFERENCES usuarios(id)
        )
    `);

    // Criar tabela de Tramitações
    db.exec(`
        CREATE TABLE IF NOT EXISTS tramitacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            protocolo_id INTEGER NOT NULL,
            setor_origem_id INTEGER NOT NULL,
            setor_destino_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            observacao TEXT,
            data_tramitacao TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (protocolo_id) REFERENCES protocolos(id),
            FOREIGN KEY (setor_origem_id) REFERENCES setores(id),
            FOREIGN KEY (setor_destino_id) REFERENCES setores(id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);

    // Criar tabela de Notificações
    db.exec(`
        CREATE TABLE IF NOT EXISTS notificacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            titulo TEXT NOT NULL,
            mensagem TEXT NOT NULL,
            protocolo_id INTEGER,
            lida INTEGER DEFAULT 0,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (protocolo_id) REFERENCES protocolos(id)
        )
    `);

    console.log('✅ Tabelas criadas com sucesso!');
    process.exit(0);
}

criarTabelas().catch(err => {
    console.error('❌ Erro ao criar tabelas:', err);
    process.exit(1);
});