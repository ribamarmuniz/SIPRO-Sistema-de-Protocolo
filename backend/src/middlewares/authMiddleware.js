const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

function authMiddleware(req, res, next) {
    // Pegar o token do header
    const authHeader = req.headers.authorization;

    // Verificar se o token foi enviado
    if (!authHeader) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    // O token vem como "Bearer TOKEN", então separamos
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ erro: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ erro: 'Token mal formatado' });
    }

    // Verificar se o token é válido
    try {
        const decoded = jwt.verify(token, authConfig.secret);
        
        // Adiciona os dados do usuário na requisição
        req.userId = decoded.id;
        req.userPerfil = decoded.perfil;
        req.userSetorId = decoded.setor_id;

        return next();
    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido' });
    }
}

// Middleware para verificar se é admin
function isAdmin(req, res, next) {
    if (req.userPerfil !== 'admin') {
        return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
    }
    return next();
}

// Middleware para verificar se é admin ou operador
function isAdminOrOperador(req, res, next) {
    if (req.userPerfil !== 'admin' && req.userPerfil !== 'operador') {
        return res.status(403).json({ erro: 'Acesso negado. Apenas administradores ou operadores.' });
    }
    return next();
}

module.exports = { authMiddleware, isAdmin, isAdminOrOperador };