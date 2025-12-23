const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

// Middleware de autenticação inline
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

// Relatório geral por período
router.get('/', (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        if (!data_inicio || !data_fim) {
            return res.status(400).json({ erro: 'Informe data_inicio e data_fim' });
        }

        // Total de protocolos no período
        const totalGeral = db.prepare(`
            SELECT COUNT(*) as total 
            FROM protocolos 
            WHERE DATE(criado_em) >= ? AND DATE(criado_em) <= ?
        `).get(data_inicio, data_fim);

        // Por status
        const porStatus = db.prepare(`
            SELECT 
                status,
                COUNT(*) as quantidade
            FROM protocolos 
            WHERE DATE(criado_em) >= ? AND DATE(criado_em) <= ?
            GROUP BY status
        `).all(data_inicio, data_fim);

        // Por setor destino
        const porSetorDestino = db.prepare(`
            SELECT 
                s.sigla as setor,
                s.nome as setor_nome,
                COUNT(*) as quantidade
            FROM protocolos p
            INNER JOIN setores s ON p.setor_destino_id = s.id
            WHERE DATE(p.criado_em) >= ? AND DATE(p.criado_em) <= ?
            GROUP BY p.setor_destino_id
            ORDER BY quantidade DESC
        `).all(data_inicio, data_fim);

        // Por setor origem
        const porSetorOrigem = db.prepare(`
            SELECT 
                s.sigla as setor,
                s.nome as setor_nome,
                COUNT(*) as quantidade
            FROM protocolos p
            INNER JOIN setores s ON p.setor_origem_id = s.id
            WHERE DATE(p.criado_em) >= ? AND DATE(p.criado_em) <= ?
            GROUP BY p.setor_origem_id
            ORDER BY quantidade DESC
        `).all(data_inicio, data_fim);

        // Por tipo de documento
        const porTipoDocumento = db.prepare(`
            SELECT 
                t.nome as tipo,
                COUNT(*) as quantidade
            FROM protocolos p
            INNER JOIN tipos_documento t ON p.tipo_documento_id = t.id
            WHERE DATE(p.criado_em) >= ? AND DATE(p.criado_em) <= ?
            GROUP BY p.tipo_documento_id
            ORDER BY quantidade DESC
        `).all(data_inicio, data_fim);

        // Por dia (para gráfico de linha)
        const porDia = db.prepare(`
            SELECT 
                DATE(criado_em) as data,
                COUNT(*) as quantidade
            FROM protocolos 
            WHERE DATE(criado_em) >= ? AND DATE(criado_em) <= ?
            GROUP BY DATE(criado_em)
            ORDER BY data
        `).all(data_inicio, data_fim);

        // Lista detalhada dos protocolos
        const protocolos = db.prepare(`
            SELECT 
                p.*,
                t.nome as tipo_documento_nome,
                so.sigla as setor_origem_sigla,
                so.nome as setor_origem_nome,
                sd.sigla as setor_destino_sigla,
                sd.nome as setor_destino_nome,
                u.nome as remetente_nome
            FROM protocolos p
            LEFT JOIN tipos_documento t ON p.tipo_documento_id = t.id
            LEFT JOIN setores so ON p.setor_origem_id = so.id
            LEFT JOIN setores sd ON p.setor_destino_id = sd.id
            LEFT JOIN usuarios u ON p.remetente_id = u.id
            WHERE DATE(p.criado_em) >= ? AND DATE(p.criado_em) <= ?
            ORDER BY p.criado_em DESC
        `).all(data_inicio, data_fim);

        // Formatar status para exibição
        const statusFormatado = {
            aguardando: 0,
            em_transito: 0,
            recebido: 0,
            arquivado: 0
        };

        porStatus.forEach(s => {
            if (statusFormatado.hasOwnProperty(s.status)) {
                statusFormatado[s.status] = s.quantidade;
            }
        });

        res.json({
            periodo: { data_inicio, data_fim },
            resumo: {
                total: totalGeral?.total || 0,
                ...statusFormatado
            },
            porStatus: statusFormatado,
            porSetorDestino: porSetorDestino || [],
            porSetorOrigem: porSetorOrigem || [],
            porTipoDocumento: porTipoDocumento || [],
            porDia: porDia || [],
            protocolos: protocolos || []
        });

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ erro: 'Erro ao gerar relatório' });
    }
});

module.exports = router;