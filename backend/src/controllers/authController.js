const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authConfig = require('../config/auth');
const emailService = require('../services/emailService'); // Importar emailService

const authController = {
    
    // POST /auth/login
    login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
            }

            const usuario = db.prepare(`
                SELECT u.*, s.nome as setor_nome, s.sigla as setor_sigla
                FROM usuarios u
                LEFT JOIN setores s ON u.setor_id = s.id
                WHERE u.email = ? AND u.ativo = 1
            `).get(email);

            if (!usuario) {
                return res.status(401).json({ erro: 'Email ou senha incorretos' });
            }

            const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);

            if (!senhaCorreta) {
                return res.status(401).json({ erro: 'Email ou senha incorretos' });
            }

            const token = jwt.sign(
                { 
                    id: usuario.id, 
                    perfil: usuario.perfil,
                    setor_id: usuario.setor_id
                },
                authConfig.secret,
                { expiresIn: authConfig.expiresIn }
            );

            return res.json({
                mensagem: 'Login realizado com sucesso!',
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil,
                    setor: usuario.setor_id ? {
                        id: usuario.setor_id,
                        nome: usuario.setor_nome,
                        sigla: usuario.setor_sigla
                    } : null
                },
                token
            });

        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // GET /auth/me
    me(req, res) {
        try {
            const usuario = db.prepare(`
                SELECT u.id, u.nome, u.email, u.perfil, u.setor_id,
                       s.nome as setor_nome, s.sigla as setor_sigla
                FROM usuarios u
                LEFT JOIN setores s ON u.setor_id = s.id
                WHERE u.id = ? AND u.ativo = 1
            `).get(req.userId);

            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            return res.json({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
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

    // PUT /auth/alterar-senha
    alterarSenha(req, res) {
        try {
            const { senhaAtual, novaSenha } = req.body;
            const userId = req.userId;

            if (!senhaAtual || !novaSenha) {
                return res.status(400).json({ erro: 'Preencha todos os campos' });
            }

            const usuario = db.prepare('SELECT senha FROM usuarios WHERE id = ?').get(userId);

            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            const senhaCorreta = bcrypt.compareSync(senhaAtual, usuario.senha);
            if (!senhaCorreta) {
                return res.status(400).json({ erro: 'A senha atual está incorreta' });
            }

            const novaSenhaHash = bcrypt.hashSync(novaSenha, 10);

            db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(novaSenhaHash, userId);

            return res.json({ mensagem: 'Senha alterada com sucesso!' });

        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },

    // POST /auth/recuperar-senha (NOVO)
    async recuperarSenha(req, res) {
        try {
            const { email } = req.body;

            const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

            if (!usuario) {
                return res.status(400).json({ erro: 'E-mail não encontrado no sistema' });
            }

            // Gerar senha aleatória de 8 caracteres
            const novaSenha = Math.random().toString(36).slice(-8).toUpperCase();
            
            // Criptografar
            const hash = bcrypt.hashSync(novaSenha, 10);

            // Atualizar no banco
            db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(hash, usuario.id);

            // Enviar Email
            const mensagem = `Olá, ${usuario.nome}.\n\nVocê solicitou a recuperação de senha no Sistema de Protocolo Geral da UEMA.\n\nSua nova senha temporária é: <b>${novaSenha}</b>\n\nPor favor, faça login e altere sua senha imediatamente para garantir a segurança da sua conta.`;
            
            await emailService.enviarEmail(email, 'Recuperação de Senha - Protocolo UEMA', mensagem);

            return res.json({ mensagem: 'Uma nova senha foi enviada para o seu e-mail.' });

        } catch (error) {
            console.error('Erro na recuperação de senha:', error);
            return res.status(500).json({ erro: 'Erro ao processar recuperação de senha' });
        }
    }
};

module.exports = authController;