const express = require('express');
const router = express.Router();
const tipoDocumentoController = require('../controllers/tipoDocumentoController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /tipos-documento - Listar todos
router.get('/', tipoDocumentoController.listar);

// POST /tipos-documento - Criar novo (apenas admin)
router.post('/', isAdmin, tipoDocumentoController.criar);

module.exports = router;