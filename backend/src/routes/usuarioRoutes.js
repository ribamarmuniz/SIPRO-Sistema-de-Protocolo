const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

// Todas as rotas precisam de autenticação e ser admin
router.use(authMiddleware);
router.use(isAdmin);

// GET /usuarios - Listar todos
router.get('/', usuarioController.listar);

// GET /usuarios/:id - Buscar por ID
router.get('/:id', usuarioController.buscarPorId);

// POST /usuarios - Criar novo
router.post('/', usuarioController.criar);

// PUT /usuarios/:id - Atualizar
router.put('/:id', usuarioController.atualizar);

// DELETE /usuarios/:id - Deletar
router.delete('/:id', usuarioController.deletar);

module.exports = router;