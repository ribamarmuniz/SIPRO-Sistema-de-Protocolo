const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// POST /ia/buscar - Busca com linguagem natural
router.post('/buscar', iaController.buscar);

// GET /ia/sugestoes - Sugestões de perguntas
router.get('/sugestoes', iaController.sugestoes);

module.exports = router;