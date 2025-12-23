const db = require('../config/database');

const tipoDocumentoController = {

    // GET /tipos-documento - Listar todos
    listar(req, res) {
        try {
            const tipos = db.prepare(`
                SELECT * FROM tipos_documento WHERE ativo = 1 ORDER BY nome
            `).all();

            return res.json(tipos);

        } catch (error) {
            console.error('Erro ao listar tipos de documento:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // POST /tipos-documento - Criar novo
    criar(req, res) {
        try {
            const { nome, descricao, prazo_padrao } = req.body;

            if (!nome) {
                return res.status(400).json({ erro: 'Nome é obrigatório' });
            }

            const existe = db.prepare('SELECT id FROM tipos_documento WHERE nome = ?').get(nome);
            if (existe) {
                return res.status(400).json({ erro: 'Este tipo já existe' });
            }

            const result = db.prepare(`
                INSERT INTO tipos_documento (nome, descricao, prazo_padrao)
                VALUES (?, ?, ?)
            `).run(nome, descricao || null, prazo_padrao || 30);

            return res.status(201).json({
                mensagem: 'Tipo de documento criado com sucesso!',
                id: result.lastInsertRowid
            });

        } catch (error) {
            console.error('Erro ao criar tipo de documento:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
};

module.exports = tipoDocumentoController;