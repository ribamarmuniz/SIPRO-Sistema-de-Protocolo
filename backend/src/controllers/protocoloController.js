const db = require('../config/database');
const gerarNumeroProtocolo = require('../utils/gerarNumeroProtocolo');
const notificacaoService = require('../services/notificacaoService');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const protocoloController = {

    // GET /protocolos - Listar todos
    listar(req, res) {
        try {
            const { status, setor_destino_id, tipo_documento_id, data_inicio, data_fim, busca } = req.query;
            const userId = req.userId;
            const userPerfil = req.userPerfil;
            const userSetorId = req.userSetorId;

            let query = `
                SELECT 
                    p.*,
                    td.nome as tipo_documento_nome,
                    u.nome as remetente_nome,
                    so.nome as setor_origem_nome,
                    so.sigla as setor_origem_sigla,
                    sd.nome as setor_destino_nome,
                    sd.sigla as setor_destino_sigla,
                    ur.nome as recebido_por_nome
                FROM protocolos p
                LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
                LEFT JOIN usuarios u ON p.remetente_id = u.id
                LEFT JOIN setores so ON p.setor_origem_id = so.id
                LEFT JOIN setores sd ON p.setor_destino_id = sd.id
                LEFT JOIN usuarios ur ON p.recebido_por_id = ur.id
                WHERE 1=1
            `;

            let params = [];

            if (userPerfil !== 'admin' && userPerfil !== 'operador') {
                query += ` AND (p.remetente_id = ? OR p.setor_destino_id = ? OR p.setor_origem_id = ?)`;
                params.push(userId, userSetorId, userSetorId);
            }

            if (status) {
                query += ` AND p.status = ?`;
                params.push(status);
            }

            if (setor_destino_id) {
                query += ` AND p.setor_destino_id = ?`;
                params.push(setor_destino_id);
            }

            if (tipo_documento_id) {
                query += ` AND p.tipo_documento_id = ?`;
                params.push(tipo_documento_id);
            }

            if (data_inicio) {
                query += ` AND DATE(p.criado_em) >= ?`;
                params.push(data_inicio);
            }

            if (data_fim) {
                query += ` AND DATE(p.criado_em) <= ?`;
                params.push(data_fim);
            }

            if (busca) {
                query += ` AND (
                    p.numero_protocolo LIKE ? OR 
                    p.assunto LIKE ? OR 
                    p.descricao LIKE ? OR 
                    td.nome LIKE ?
                )`;
                const termoBusca = `%${busca}%`;
                params.push(termoBusca, termoBusca, termoBusca, termoBusca);
            }

            query += ` ORDER BY p.criado_em DESC`;

            const protocolos = db.prepare(query).all(...params);

            return res.json(protocolos);

        } catch (error) {
            console.error('Erro ao listar protocolos:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // GET /protocolos/:id - Buscar por ID
    buscarPorId(req, res) {
        try {
            const { id } = req.params;

            const protocolo = db.prepare(`
                SELECT 
                    p.*,
                    td.nome as tipo_documento_nome,
                    u.nome as remetente_nome,
                    u.email as remetente_email,
                    so.nome as setor_origem_nome,
                    so.sigla as setor_origem_sigla,
                    sd.nome as setor_destino_nome,
                    sd.sigla as setor_destino_sigla,
                    ur.nome as recebido_por_nome
                FROM protocolos p
                LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
                LEFT JOIN usuarios u ON p.remetente_id = u.id
                LEFT JOIN setores so ON p.setor_origem_id = so.id
                LEFT JOIN setores sd ON p.setor_destino_id = sd.id
                LEFT JOIN usuarios ur ON p.recebido_por_id = ur.id
                WHERE p.id = ?
            `).get(id);

            if (!protocolo) {
                return res.status(404).json({ erro: 'Protocolo não encontrado' });
            }

            const tramitacoes = db.prepare(`
                SELECT 
                    t.*,
                    so.nome as setor_origem_nome,
                    so.sigla as setor_origem_sigla,
                    sd.nome as setor_destino_nome,
                    sd.sigla as setor_destino_sigla,
                    u.nome as usuario_nome
                FROM tramitacoes t
                LEFT JOIN setores so ON t.setor_origem_id = so.id
                LEFT JOIN setores sd ON t.setor_destino_id = sd.id
                LEFT JOIN usuarios u ON t.usuario_id = u.id
                WHERE t.protocolo_id = ?
                ORDER BY t.data_tramitacao DESC
            `).all(id);

            return res.json({
                ...protocolo,
                tramitacoes
            });

        } catch (error) {
            console.error('Erro ao buscar protocolo:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // POST /protocolos - Criar novo protocolo
    criar(req, res) {
        try {
            const { tipo_documento_id, assunto, descricao, setor_destino_id } = req.body;
            const userId = req.userId;
            const userSetorId = req.userSetorId;

            if (!tipo_documento_id || !assunto || !setor_destino_id) {
                return res.status(400).json({ 
                    erro: 'Tipo de documento, assunto e setor de destino são obrigatórios' 
                });
            }

            const numeroProtocolo = gerarNumeroProtocolo();

            let arquivoUrl = null;
            if (req.file) {
                arquivoUrl = req.file.filename;
            }

            const result = db.prepare(`
                INSERT INTO protocolos (
                    numero_protocolo,
                    tipo_documento_id,
                    assunto,
                    descricao,
                    arquivo_url,
                    remetente_id,
                    setor_origem_id,
                    setor_destino_id,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'em_transito')
            `).run(
                numeroProtocolo,
                tipo_documento_id,
                assunto,
                descricao || null,
                arquivoUrl,
                userId,
                userSetorId,
                setor_destino_id
            );

            db.prepare(`
                INSERT INTO tramitacoes (
                    protocolo_id,
                    setor_origem_id,
                    setor_destino_id,
                    usuario_id,
                    observacao
                ) VALUES (?, ?, ?, ?, ?)
            `).run(
                result.lastInsertRowid,
                userSetorId,
                setor_destino_id,
                userId,
                'Protocolo criado e enviado'
            );

            // Notificar setor de destino
            notificacaoService.notificarSetor(
                setor_destino_id,
                'novo_protocolo',
                'Novo Protocolo Recebido',
                `O protocolo ${numeroProtocolo} - "${assunto}" foi enviado para o seu setor.`,
                result.lastInsertRowid
            );

            return res.status(201).json({
                mensagem: 'Protocolo criado com sucesso!',
                id: result.lastInsertRowid,
                numero_protocolo: numeroProtocolo
            });

        } catch (error) {
            console.error('Erro ao criar protocolo:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // PUT /protocolos/:id/receber - Marcar como recebido (COM SENHA OBRIGATÓRIA)
    async marcarRecebido(req, res) {
        try {
            const { id } = req.params;
            const { senha } = req.body;
            const userId = req.userId;

            if (!senha) {
                return res.status(400).json({ erro: 'A senha é obrigatória para assinar o recebimento' });
            }

            // 1. Validar Senha do Usuário (Assinatura)
            const usuario = db.prepare('SELECT senha FROM usuarios WHERE id = ?').get(userId);
            if (!usuario) {
                return res.status(401).json({ erro: 'Usuário não encontrado' });
            }

            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
            if (!senhaCorreta) {
                // Retorna 400 (Bad Request) em vez de 401 para não deslogar o frontend
                return res.status(400).json({ erro: 'Senha incorreta. Assinatura falhou.' });
            }

            // 2. Continua o processo normal
            const protocolo = db.prepare('SELECT * FROM protocolos WHERE id = ?').get(id);

            if (!protocolo) {
                return res.status(404).json({ erro: 'Protocolo não encontrado' });
            }

            if (protocolo.status === 'recebido') {
                return res.status(400).json({ erro: 'Protocolo já foi marcado como recebido' });
            }

            db.prepare(`
                UPDATE protocolos 
                SET status = 'recebido', 
                    recebido_em = CURRENT_TIMESTAMP,
                    recebido_por_id = ?,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(userId, id);

            // Grava na tramitação que foi assinado
            db.prepare(`
                INSERT INTO tramitacoes (
                    protocolo_id,
                    setor_origem_id,
                    setor_destino_id,
                    usuario_id,
                    observacao
                ) VALUES (?, ?, ?, ?, ?)
            `).run(
                id,
                protocolo.setor_destino_id,
                protocolo.setor_destino_id,
                userId,
                'Recebimento confirmado via Assinatura Digital (Senha verificada)'
            );

            // Notificar remetente que o protocolo foi recebido
            notificacaoService.criar(
                protocolo.remetente_id,
                'recebido',
                'Protocolo Recebido',
                `O protocolo ${protocolo.numero_protocolo} foi recebido e assinado digitalmente.`,
                id
            );

            return res.json({ mensagem: 'Protocolo recebido e assinado com sucesso!' });

        } catch (error) {
            console.error('Erro ao marcar recebido:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // PUT /protocolos/:id/tramitar - Tramitar (BLOQUEIA SE NÃO ESTIVER RECEBIDO)
    tramitar(req, res) {
        try {
            const { id } = req.params;
            const { setor_destino_id, observacao } = req.body;
            const userId = req.userId;

            if (!setor_destino_id) {
                return res.status(400).json({ erro: 'Setor de destino é obrigatório' });
            }

            const protocolo = db.prepare('SELECT * FROM protocolos WHERE id = ?').get(id);

            if (!protocolo) {
                return res.status(404).json({ erro: 'Protocolo não encontrado' });
            }

            if (protocolo.status === 'arquivado') {
                return res.status(400).json({ erro: 'Protocolo arquivado não pode ser tramitado' });
            }

            // === REGRA DE NEGÓCIO: SÓ TRAMITA SE JÁ TIVER RECEBIDO ===
            if (protocolo.status !== 'recebido') {
                return res.status(400).json({ 
                    erro: 'Ação Bloqueada: É necessário receber (assinar) o protocolo antes de tramitá-lo.' 
                });
            }

            const setorOrigemId = protocolo.setor_destino_id;

            db.prepare(`
                UPDATE protocolos 
                SET setor_origem_id = ?,
                    setor_destino_id = ?,
                    status = 'em_transito',
                    recebido_em = NULL,
                    recebido_por_id = NULL,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(setorOrigemId, setor_destino_id, id);

            db.prepare(`
                INSERT INTO tramitacoes (
                    protocolo_id,
                    setor_origem_id,
                    setor_destino_id,
                    usuario_id,
                    observacao
                ) VALUES (?, ?, ?, ?, ?)
            `).run(id, setorOrigemId, setor_destino_id, userId, observacao || 'Tramitado');

            // Notificar novo setor de destino
            notificacaoService.notificarSetor(
                setor_destino_id,
                'tramitacao',
                'Protocolo Tramitado',
                `O protocolo ${protocolo.numero_protocolo} foi tramitado para o seu setor.${observacao ? ' Obs: ' + observacao : ''}`,
                id
            );

            // Notificar remetente original
            notificacaoService.criar(
                protocolo.remetente_id,
                'tramitacao',
                'Seu Protocolo foi Tramitado',
                `O protocolo ${protocolo.numero_protocolo} foi tramitado para outro setor.`,
                id
            );

            return res.json({ mensagem: 'Protocolo tramitado com sucesso!' });

        } catch (error) {
            console.error('Erro ao tramitar:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // PUT /protocolos/:id/arquivar - Arquivar protocolo
    arquivar(req, res) {
        try {
            const { id } = req.params;

            const protocolo = db.prepare('SELECT * FROM protocolos WHERE id = ?').get(id);

            if (!protocolo) {
                return res.status(404).json({ erro: 'Protocolo não encontrado' });
            }

            db.prepare(`
                UPDATE protocolos 
                SET status = 'arquivado',
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(id);

            // Notificar remetente
            notificacaoService.criar(
                protocolo.remetente_id,
                'arquivado',
                'Protocolo Arquivado',
                `O protocolo ${protocolo.numero_protocolo} foi arquivado.`,
                id
            );

            return res.json({ mensagem: 'Protocolo arquivado com sucesso!' });

        } catch (error) {
            console.error('Erro ao arquivar:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // PUT /protocolos/:id/desarquivar - Desarquivar protocolo
    desarquivar(req, res) {
        try {
            const { id } = req.params;

            const protocolo = db.prepare('SELECT * FROM protocolos WHERE id = ?').get(id);

            if (!protocolo) {
                return res.status(404).json({ erro: 'Protocolo não encontrado' });
            }

            if (protocolo.status !== 'arquivado') {
                return res.status(400).json({ erro: 'Protocolo não está arquivado' });
            }

            db.prepare(`
                UPDATE protocolos 
                SET status = 'recebido',
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(id);

            return res.json({ mensagem: 'Protocolo desarquivado com sucesso!' });

        } catch (error) {
            console.error('Erro ao desarquivar:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // DELETE /protocolos/:id - Deletar protocolo
    deletar(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const userPerfil = req.userPerfil;

            const protocolo = db.prepare('SELECT * FROM protocolos WHERE id = ?').get(id);

            if (!protocolo) {
                return res.status(404).json({ erro: 'Protocolo não encontrado' });
            }

            const ehCriador = protocolo.remetente_id === userId;
            const foiRecebido = protocolo.status === 'recebido' || protocolo.recebido_em !== null;

            if (userPerfil !== 'admin') {
                if (!ehCriador) {
                    return res.status(403).json({ erro: 'Apenas o criador ou admin pode deletar' });
                }
                if (foiRecebido) {
                    return res.status(403).json({ erro: 'Protocolo já foi recebido e não pode ser deletado' });
                }
            }

            if (protocolo.arquivo_url) {
                const caminhoArquivo = path.join(__dirname, '..', '..', 'uploads', protocolo.arquivo_url);
                if (fs.existsSync(caminhoArquivo)) {
                    fs.unlinkSync(caminhoArquivo);
                }
            }

            // Deletar notificações relacionadas
            db.prepare('DELETE FROM notificacoes WHERE protocolo_id = ?').run(id);
            db.prepare('DELETE FROM tramitacoes WHERE protocolo_id = ?').run(id);
            db.prepare('DELETE FROM protocolos WHERE id = ?').run(id);

            return res.json({ mensagem: 'Protocolo deletado com sucesso!' });

        } catch (error) {
            console.error('Erro ao deletar protocolo:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // GET /protocolos/:id/qrcode - Gerar QR Code (COM HISTÓRICO)
    gerarQRCode(req, res) {
        try {
            const { id } = req.params;

            const protocolo = db.prepare(`
                SELECT 
                    p.*, 
                    so.sigla as origem_sigla, 
                    so.nome as origem_nome,
                    sd.sigla as destino_sigla,
                    sd.nome as destino_nome,
                    td.nome as tipo_documento_nome,
                    u.nome as remetente_nome
                FROM protocolos p
                LEFT JOIN setores so ON p.setor_origem_id = so.id
                LEFT JOIN setores sd ON p.setor_destino_id = sd.id
                LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
                LEFT JOIN usuarios u ON p.remetente_id = u.id
                WHERE p.id = ?
            `).get(id);

            if (!protocolo) {
                return res.status(404).json({ erro: 'Protocolo não encontrado' });
            }

            const tramitacoes = db.prepare(`
                SELECT 
                    t.*,
                    so.sigla as origem_sigla,
                    sd.sigla as destino_sigla,
                    u.nome as usuario_nome
                FROM tramitacoes t
                LEFT JOIN setores so ON t.setor_origem_id = so.id
                LEFT JOIN setores sd ON t.setor_destino_id = sd.id
                LEFT JOIN usuarios u ON t.usuario_id = u.id
                WHERE t.protocolo_id = ?
                ORDER BY t.data_tramitacao DESC
            `).all(id);

            const statusLabels = {
                'aguardando': 'Aguardando',
                'em_transito': 'Em Trânsito',
                'recebido': 'Recebido',
                'arquivado': 'Arquivado'
            };

            const dataFormatada = new Date(protocolo.criado_em).toLocaleDateString('pt-BR');

            // Monta o texto do histórico para o QR Code
            let textoHistorico = "";
            if (tramitacoes.length > 0) {
                textoHistorico += "\n-- HISTÓRICO --\n";
                tramitacoes.forEach(t => {
                    const data = new Date(t.data_tramitacao).toLocaleString('pt-BR');
                    textoHistorico += `[${data}]\n${t.origem_sigla} -> ${t.destino_sigla}\nResp: ${t.usuario_nome}\nObs: ${t.observacao || '-'}\n---\n`;
                });
            }

            const textoQR = `
PROTOCOLO UEMA - PROG
=====================
Nº: ${protocolo.numero_protocolo}
Tipo: ${protocolo.tipo_documento_nome}
Assunto: ${protocolo.assunto}
Remetente: ${protocolo.remetente_nome}
Origem: ${protocolo.origem_sigla}
Destino: ${protocolo.destino_sigla}
Status: ${statusLabels[protocolo.status]}
Data: ${dataFormatada}
=====================
${textoHistorico}
            `.trim();

            const dados = {
                numero: protocolo.numero_protocolo,
                tipo: protocolo.tipo_documento_nome,
                assunto: protocolo.assunto,
                remetente: protocolo.remetente_nome,
                origem: `${protocolo.origem_sigla} - ${protocolo.origem_nome}`,
                destino: `${protocolo.destino_sigla} - ${protocolo.destino_nome}`,
                status: statusLabels[protocolo.status],
                data: dataFormatada,
                tramitacoes: tramitacoes
            };

            QRCode.toDataURL(textoQR, {
                width: 450,
                margin: 2,
                color: {
                    dark: '#0f1e44',
                    light: '#ffffff'
                }
            }, (err, url) => {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao gerar QR Code' });
                }
                return res.json({ 
                    qrcode: url,
                    dados: dados,
                    textoQR: textoQR
                });
            });

        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
};

module.exports = protocoloController;