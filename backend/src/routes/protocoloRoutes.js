const express = require('express');
const router = express.Router();
const protocoloController = require('../controllers/protocoloController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../config/upload');

router.use(authMiddleware);

// GET /protocolos - Listar todos
router.get('/', protocoloController.listar);

// GET /protocolos/:id - Buscar por ID
router.get('/:id', protocoloController.buscarPorId);

// POST /protocolos - Criar novo (com upload de arquivo)
router.post('/', upload.single('arquivo'), protocoloController.criar);

// PUT /protocolos/:id/receber - Marcar como recebido
router.put('/:id/receber', protocoloController.marcarRecebido);

// PUT /protocolos/:id/tramitar - Tramitar para outro setor
router.put('/:id/tramitar', protocoloController.tramitar);

// PUT /protocolos/:id/arquivar - Arquivar
router.put('/:id/arquivar', protocoloController.arquivar);

// PUT /protocolos/:id/desarquivar - Desarquivar
router.put('/:id/desarquivar', protocoloController.desarquivar);

// DELETE /protocolos/:id - Deletar
router.delete('/:id', protocoloController.deletar);

// GET /protocolos/:id/qrcode - Gerar QR Code
router.get('/:id/qrcode', protocoloController.gerarQRCode);

module.exports = router;