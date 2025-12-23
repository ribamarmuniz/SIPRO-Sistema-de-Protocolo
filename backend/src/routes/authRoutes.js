const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/recuperar-senha', authController.recuperarSenha); // NOVA ROTA

// Rotas autenticadas
router.get('/me', authMiddleware, authController.me);
router.put('/alterar-senha', authMiddleware, authController.alterarSenha);

module.exports = router;