const bcrypt = require('bcryptjs');
const db = require('../config/database');

const usuarioController = {

    // GET /usuarios - Listar todos
    listar(req, res) {
        try {
            const usuarios = db.prepare(`
                SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.criado_em,
                       s.id as setor_id, s.nome as setor_nome, s.sigla as setor_sigla
                FROM usuarios u
                LEFT JOIN setores s ON u.setor_id = s.id
                ORDER BY u.nome
            `).all();

            const resultado = usuarios.map(u => ({
                id: u.id,
                nome: u.nome,
                email: u.email,
                perfil: u.perfil,
                ativo: u.ativo === 1,
                criado_em: u.criado_em,
                setor: u.setor_id ? {
                    id: u.setor_id,
                    nome: u.setor_nome,
                    sigla: u.setor_sigla
                } : null
            }));

            return res.json(resultado);

        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // GET /usuarios/:id - Buscar por ID
    buscarPorId(req, res) {
        try {
            const { id } = req.params;

            const usuario = db.prepare(`
                SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.criado_em,
                       s.id as setor_id, s.nome as setor_nome, s.sigla as setor_sigla
                FROM usuarios u
                LEFT JOIN setores s ON u.setor_id = s.id
                WHERE u.id = ?
            `).get(id);

            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            return res.json({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
                ativo: usuario.ativo === 1,
                criado_em: usuario.criado_em,
                setor: usuario.setor_id ? {
                    id: usuario.setor_id,
                    nome: usuario.setor_nome,
                    sigla: usuario.setor_sigla
                } : null
            });

        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // POST /usuarios - Criar novo
    criar(req, res) {
        try {
            const { nome, email, senha, perfil, setor_id } = req.body;

            // Validações
            if (!nome || !email || !senha || !perfil) {
                return res.status(400).json({ erro: 'Nome, email, senha e perfil são obrigatórios' });
            }

            if (!['admin', 'operador', 'usuario', 'consulta'].includes(perfil)) {
                return res.status(400).json({ erro: 'Perfil inválido' });
            }

            // Verificar se email já existe
            const emailExiste = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
            if (emailExiste) {
                return res.status(400).json({ erro: 'Este email já está cadastrado' });
            }

            // Criptografar senha
            const senhaCriptografada = bcrypt.hashSync(senha, 10);

            // Inserir usuário
            const result = db.prepare(`
                INSERT INTO usuarios (nome, email, senha, perfil, setor_id)
                VALUES (?, ?, ?, ?, ?)
            `).run(nome, email, senhaCriptografada, perfil, setor_id || null);

            return res.status(201).json({
                mensagem: 'Usuário criado com sucesso!',
                id: result.lastInsertRowid
            });

        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // PUT /usuarios/:id - Atualizar
    atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, email, senha, perfil, setor_id, ativo } = req.body;

            // Verificar se usuário existe
            const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            // Verificar se novo email já existe (em outro usuário)
            if (email) {
                const emailExiste = db.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?').get(email, id);
                if (emailExiste) {
                    return res.status(400).json({ erro: 'Este email já está cadastrado' });
                }
            }

            // Montar query de atualização
            let campos = [];
            let valores = [];

            if (nome) { campos.push('nome = ?'); valores.push(nome); }
            if (email) { campos.push('email = ?'); valores.push(email); }
            if (senha) { campos.push('senha = ?'); valores.push(bcrypt.hashSync(senha, 10)); }
            if (perfil) { campos.push('perfil = ?'); valores.push(perfil); }
            if (setor_id !== undefined) { campos.push('setor_id = ?'); valores.push(setor_id || null); }
            if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo ? 1 : 0); }

            if (campos.length === 0) {
                return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
            }

            valores.push(id);

            db.prepare(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`).run(...valores);

            return res.json({ mensagem: 'Usuário atualizado com sucesso!' });

        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // DELETE /usuarios/:id - Deletar
    deletar(req, res) {
        try {
            const { id } = req.params;

            // Não permitir deletar a si mesmo
            if (parseInt(id) === req.userId) {
                return res.status(400).json({ erro: 'Você não pode deletar seu próprio usuário' });
            }

            const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);

            return res.json({ mensagem: 'Usuário deletado com sucesso!' });

        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
};

module.exports = usuarioController;