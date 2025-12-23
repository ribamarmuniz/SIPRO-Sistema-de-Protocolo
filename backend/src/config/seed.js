const bcrypt = require('bcryptjs');
const db = require('./database');

async function executarSeed() {
    await db.aguardarInicializacao();
    
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // SETORES
    const setores = [
        { nome: 'Reitoria', sigla: 'REIT', descricao: 'Gabinete do Reitor' },
        { nome: 'Vice-Reitoria', sigla: 'VICE', descricao: 'Gabinete do Vice-Reitor' },
        { nome: 'Pró-Reitoria de Graduação', sigla: 'PROG', descricao: 'Coordena os cursos de graduação' },
        { nome: 'Pró-Reitoria de Pesquisa e Pós-Graduação', sigla: 'PPG', descricao: 'Pesquisa e pós-graduação' },
        { nome: 'Pró-Reitoria de Extensão e Assuntos Estudantis', sigla: 'PROEXAE', descricao: 'Extensão universitária' },
        { nome: 'Pró-Reitoria de Planejamento e Administração', sigla: 'PROPLAD', descricao: 'Planejamento e administração' },
        { nome: 'Pró-Reitoria de Infraestrutura', sigla: 'PROINFRA', descricao: 'Infraestrutura' },
        { nome: 'Pró-Reitoria de Gestão de Pessoas', sigla: 'PROGEP', descricao: 'Gestão de pessoas' },
        { nome: 'Centro de Ciências Tecnológicas', sigla: 'CCT', descricao: 'Engenharias e tecnologia' },
        { nome: 'Centro de Ciências Sociais Aplicadas', sigla: 'CCSA', descricao: 'Ciências sociais' },
        { nome: 'Departamento de Engenharia da Computação', sigla: 'DCOMP', descricao: 'Engenharia da Computação' },
        { nome: 'Coordenação de Tecnologia da Informação', sigla: 'CTIC', descricao: 'TI e suporte' },
        { nome: 'Protocolo Geral', sigla: 'PROTOC', descricao: 'Protocolo Geral da UEMA' }
    ];

    console.log('📁 Criando setores...');
    setores.forEach(setor => {
        try {
            const existe = db.prepare('SELECT id FROM setores WHERE sigla = ?').get(setor.sigla);
            if (!existe) {
                db.prepare('INSERT INTO setores (nome, sigla, descricao) VALUES (?, ?, ?)').run(setor.nome, setor.sigla, setor.descricao);
                console.log(`   ✅ ${setor.sigla}`);
            }
        } catch (e) {
            // Ignora se já existe
        }
    });

    // TIPOS DE DOCUMENTO
    const tipos = [
        { nome: 'Ofício', descricao: 'Documento oficial', prazo: 30 },
        { nome: 'Memorando', descricao: 'Comunicação interna', prazo: 15 },
        { nome: 'Requerimento', descricao: 'Solicitação formal', prazo: 30 },
        { nome: 'Processo Administrativo', descricao: 'Processo administrativo', prazo: 60 },
        { nome: 'Declaração', descricao: 'Documento declaratório', prazo: 15 }
    ];

    console.log('\n📄 Criando tipos de documento...');
    tipos.forEach(tipo => {
        try {
            const existe = db.prepare('SELECT id FROM tipos_documento WHERE nome = ?').get(tipo.nome);
            if (!existe) {
                db.prepare('INSERT INTO tipos_documento (nome, descricao, prazo_padrao) VALUES (?, ?, ?)').run(tipo.nome, tipo.descricao, tipo.prazo);
                console.log(`   ✅ ${tipo.nome}`);
            }
        } catch (e) {
            // Ignora se já existe
        }
    });

    // USUÁRIOS
    function getSetorId(sigla) {
        const setor = db.prepare('SELECT id FROM setores WHERE sigla = ?').get(sigla);
        return setor ? setor.id : null;
    }

    const usuarios = [
        { nome: 'Administrador', email: 'admin@uema.br', senha: 'admin123', perfil: 'admin', setor: 'CTIC' },
        { nome: 'Operador Protocolo', email: 'protocolo@uema.br', senha: 'protocolo123', perfil: 'operador', setor: 'PROTOC' },
        { nome: 'Usuário DCOMP', email: 'dcomp@uema.br', senha: 'uema123', perfil: 'usuario', setor: 'DCOMP' },
        { nome: 'Usuário PROG', email: 'prog@uema.br', senha: 'uema123', perfil: 'usuario', setor: 'PROG' },
        { nome: 'Usuário CCT', email: 'cct@uema.br', senha: 'uema123', perfil: 'usuario', setor: 'CCT' }
    ];

    console.log('\n👥 Criando usuários...');
    usuarios.forEach(usuario => {
        try {
            const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(usuario.email);
            if (!existe) {
                const senhaCriptografada = bcrypt.hashSync(usuario.senha, 10);
                const setorId = getSetorId(usuario.setor);
                db.prepare('INSERT INTO usuarios (nome, email, senha, perfil, setor_id) VALUES (?, ?, ?, ?, ?)').run(
                    usuario.nome, usuario.email, senhaCriptografada, usuario.perfil, setorId
                );
                console.log(`   ✅ ${usuario.email}`);
            }
        } catch (e) {
            // Ignora se já existe
        }
    });

    console.log('\n=========================================');
    console.log('🎉 Seed concluído!');
    console.log('=========================================');
    console.log('\n👑 ADMIN: admin@uema.br / admin123');
    console.log('📝 OPERADOR: protocolo@uema.br / protocolo123');
    console.log('👤 USUÁRIO: dcomp@uema.br / uema123');
    console.log('=========================================\n');
    
    process.exit(0);
}

executarSeed().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});