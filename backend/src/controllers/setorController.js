const db = require('../config/database');

const setorController = {

    // GET /setores - Listar todos
    listar(req, res) {
        try {
            const setores = db.prepare(`
                SELECT * FROM setores ORDER BY nome
            `).all();

            const resultado = setores.map(s => ({
                ...s,
                ativo: s.ativo === 1
            }));

            return res.json(resultado);

        } catch (error) {
            console.error('Erro ao listar setores:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // GET /setores/:id - Buscar por ID
    buscarPorId(req, res) {
        try {
            const { id } = req.params;

            const setor = db.prepare('SELECT * FROM setores WHERE id = ?').get(id);

            if (!setor) {
                return res.status(404).json({ erro: 'Setor não encontrado' });
            }

            return res.json({
                ...setor,
                ativo: setor.ativo === 1
            });

        } catch (error) {
            console.error('Erro ao buscar setor:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // POST /setores - Criar novo
    criar(req, res) {
        try {
            const { nome, sigla, descricao } = req.body;

            // Validações
            if (!nome || !sigla) {
                return res.status(400).json({ erro: 'Nome e sigla são obrigatórios' });
            }

            // Verificar se sigla já existe
            const siglaExiste = db.prepare('SELECT id FROM setores WHERE sigla = ?').get(sigla.toUpperCase());
            if (siglaExiste) {
                return res.status(400).json({ erro: 'Esta sigla já está cadastrada' });
            }

            // Inserir setor
            const result = db.prepare(`
                INSERT INTO setores (nome, sigla, descricao)
                VALUES (?, ?, ?)
            `).run(nome, sigla.toUpperCase(), descricao || null);

            return res.status(201).json({
                mensagem: 'Setor criado com sucesso!',
                id: result.lastInsertRowid
            });

        } catch (error) {
            console.error('Erro ao criar setor:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // PUT /setores/:id - Atualizar
    atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, sigla, descricao, ativo } = req.body;

            // Verificar se setor existe
            const setor = db.prepare('SELECT id FROM setores WHERE id = ?').get(id);
            if (!setor) {
                return res.status(404).json({ erro: 'Setor não encontrado' });
            }

            // Verificar se nova sigla já existe (em outro setor)
            if (sigla) {
                const siglaExiste = db.prepare('SELECT id FROM setores WHERE sigla = ? AND id != ?').get(sigla.toUpperCase(), id);
                if (siglaExiste) {
                    return res.status(400).json({ erro: 'Esta sigla já está cadastrada' });
                }
            }

            // Montar query de atualização
            let campos = [];
            let valores = [];

            if (nome) { campos.push('nome = ?'); valores.push(nome); }
            if (sigla) { campos.push('sigla = ?'); valores.push(sigla.toUpperCase()); }
            if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao); }
            if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo ? 1 : 0); }

            if (campos.length === 0) {
                return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
            }

            valores.push(id);

            db.prepare(`UPDATE setores SET ${campos.join(', ')} WHERE id = ?`).run(...valores);

            return res.json({ mensagem: 'Setor atualizado com sucesso!' });

        } catch (error) {
            console.error('Erro ao atualizar setor:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // DELETE /setores/:id - Deletar
    deletar(req, res) {
        try {
            const { id } = req.params;

            const setor = db.prepare('SELECT id FROM setores WHERE id = ?').get(id);
            if (!setor) {
                return res.status(404).json({ erro: 'Setor não encontrado' });
            }

            // Verificar se há usuários vinculados
            const usuariosVinculados = db.prepare('SELECT COUNT(*) as total FROM usuarios WHERE setor_id = ?').get(id);
            if (usuariosVinculados.total > 0) {
                return res.status(400).json({ erro: 'Não é possível deletar. Existem usuários vinculados a este setor.' });
            }

            // Verificar se há protocolos vinculados
            const protocolosVinculados = db.prepare(`
                SELECT COUNT(*) as total FROM protocolos 
                WHERE setor_origem_id = ? OR setor_destino_id = ?
            `).get(id, id);
            if (protocolosVinculados.total > 0) {
                return res.status(400).json({ erro: 'Não é possível deletar. Existem protocolos vinculados a este setor.' });
            }

            db.prepare('DELETE FROM setores WHERE id = ?').run(id);

            return res.json({ mensagem: 'Setor deletado com sucesso!' });

        } catch (error) {
            console.error('Erro ao deletar setor:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
};

module.exports = setorController;