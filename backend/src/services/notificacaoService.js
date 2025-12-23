const db = require('../config/database');
const emailService = require('./emailService');

const notificacaoService = {
    
    // Criar notificação para um usuário específico
    criar(usuarioId, tipo, titulo, mensagem, protocoloId = null) {
        try {
            db.prepare(`
                INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, protocolo_id, lida)
                VALUES (?, ?, ?, ?, ?, 0)
            `).run(usuarioId, tipo, titulo, mensagem, protocoloId);
        } catch (error) {
            console.error('Erro ao criar notificação individual:', error);
        }
    },

    // Notificar todos os usuários de um setor (E ENVIAR EMAIL)
    notificarSetor(setorId, tipo, titulo, mensagem, protocoloId = null) {
        try {
            // 1. Buscar todos os usuários do setor
            const usuarios = db.prepare('SELECT id FROM usuarios WHERE setor_id = ? AND ativo = 1').all(setorId);

            if (!usuarios || usuarios.length === 0) return;

            // 2. Criar notificação no sistema para cada um (Correção: Loop simples ao invés de transaction)
            for (const user of usuarios) {
                try {
                    db.prepare(`
                        INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, protocolo_id, lida)
                        VALUES (?, ?, ?, ?, ?, 0)
                    `).run(user.id, tipo, titulo, mensagem, protocoloId);
                } catch (err) {
                    console.error(`Erro ao notificar usuário ${user.id}:`, err);
                }
            }

            // 3. DISPARAR EMAIL PARA O SETOR
            // Buscamos o número do protocolo para colocar no assunto do email
            let numeroProtocolo = 'N/A';
            if (protocoloId) {
                const proto = db.prepare('SELECT numero_protocolo FROM protocolos WHERE id = ?').get(protocoloId);
                if (proto) numeroProtocolo = proto.numero_protocolo;
            }

            // Chama o serviço de email de forma assíncrona (sem await para não travar a resposta da API)
            emailService.enviarParaSetor(setorId, titulo, mensagem, numeroProtocolo)
                .catch(err => console.error('Falha no envio de email:', err));

        } catch (error) {
            console.error('Erro ao notificar setor:', error);
        }
    },

    marcarComoLida(notificacaoId) {
        db.prepare('UPDATE notificacoes SET lida = 1 WHERE id = ?').run(notificacaoId);
    },

    marcarTodasComoLidas(usuarioId) {
        db.prepare('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?').run(usuarioId);
    },

    listarPorUsuario(usuarioId) {
        return db.prepare(`
            SELECT * FROM notificacoes 
            WHERE usuario_id = ? 
            ORDER BY criado_em DESC 
            LIMIT 50
        `).all(usuarioId);
    },

    contarNaoLidas(usuarioId) {
        return db.prepare(`
            SELECT COUNT(*) as total FROM notificacoes 
            WHERE usuario_id = ? AND lida = 0
        `).get(usuarioId);
    },

    deletar(id) {
        db.prepare('DELETE FROM notificacoes WHERE id = ?').run(id);
    }
};

module.exports = notificacaoService;