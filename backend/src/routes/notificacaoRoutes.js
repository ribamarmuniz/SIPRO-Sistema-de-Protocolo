const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

// Middleware de autenticação
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ erro: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ erro: 'Token mal formatado' });
    }

    try {
        const decoded = jwt.verify(token, authConfig.secret);
        req.userId = decoded.id;
        req.userPerfil = decoded.perfil;
        req.userSetorId = decoded.setor_id;
        return next();
    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido' });
    }
}

router.use(authMiddleware);

// Listar notificações do usuário
router.get('/', (req, res) => {
    try {
        const notificacoes = db.prepare(`
            SELECT 
                n.*,
                p.numero_protocolo,
                p.assunto as protocolo_assunto
            FROM notificacoes n
            LEFT JOIN protocolos p ON n.protocolo_id = p.id
            WHERE n.usuario_id = ?
            ORDER BY n.criado_em DESC
            LIMIT 50
        `).all(req.userId);

        res.json(notificacoes);
    } catch (error) {
        console.error('Erro ao listar notificações:', error);
        res.status(500).json({ erro: 'Erro ao listar notificações' });
    }
});

// Contar notificações não lidas
router.get('/nao-lidas/count', (req, res) => {
    try {
        const resultado = db.prepare(`
            SELECT COUNT(*) as total
            FROM notificacoes
            WHERE usuario_id = ? AND lida = 0
        `).get(req.userId);

        res.json({ total: resultado?.total || 0 });
    } catch (error) {
        console.error('Erro ao contar notificações:', error);
        res.status(500).json({ erro: 'Erro ao contar notificações' });
    }
});

// Marcar notificação como lida
router.put('/:id/lida', (req, res) => {
    try {
        const { id } = req.params;

        db.prepare(`
            UPDATE notificacoes 
            SET lida = 1 
            WHERE id = ? AND usuario_id = ?
        `).run(id, req.userId);

        res.json({ mensagem: 'Notificação marcada como lida' });
    } catch (error) {
        console.error('Erro ao marcar notificação:', error);
        res.status(500).json({ erro: 'Erro ao marcar notificação' });
    }
});

// Marcar todas como lidas
router.put('/marcar-todas-lidas', (req, res) => {
    try {
        db.prepare(`
            UPDATE notificacoes 
            SET lida = 1 
            WHERE usuario_id = ? AND lida = 0
        `).run(req.userId);

        res.json({ mensagem: 'Todas as notificações foram marcadas como lidas' });
    } catch (error) {
        console.error('Erro ao marcar notificações:', error);
        res.status(500).json({ erro: 'Erro ao marcar notificações' });
    }
});

// Excluir notificação
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        db.prepare(`
            DELETE FROM notificacoes 
            WHERE id = ? AND usuario_id = ?
        `).run(id, req.userId);

        res.json({ mensagem: 'Notificação excluída' });
    } catch (error) {
        console.error('Erro ao excluir notificação:', error);
        res.status(500).json({ erro: 'Erro ao excluir notificação' });
    }
});

// Limpar todas as notificações lidas
router.delete('/limpar/lidas', (req, res) => {
    try {
        db.prepare(`
            DELETE FROM notificacoes 
            WHERE usuario_id = ? AND lida = 1
        `).run(req.userId);

        res.json({ mensagem: 'Notificações lidas excluídas' });
    } catch (error) {
        console.error('Erro ao limpar notificações:', error);
        res.status(500).json({ erro: 'Erro ao limpar notificações' });
    }
});

module.exports = router;