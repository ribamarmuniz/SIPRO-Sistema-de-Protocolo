const express = require('express');
const router = express.Router();
const setorController = require('../controllers/setorController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// GET /setores - Listar todos (qualquer usuário logado)
router.get('/', setorController.listar);

// GET /setores/:id - Buscar por ID (qualquer usuário logado)
router.get('/:id', setorController.buscarPorId);

// POST /setores - Criar novo (apenas admin)
router.post('/', isAdmin, setorController.criar);

// PUT /setores/:id - Atualizar (apenas admin)
router.put('/:id', isAdmin, setorController.atualizar);

// DELETE /setores/:id - Deletar (apenas admin)
router.delete('/:id', isAdmin, setorController.deletar);

module.exports = router;