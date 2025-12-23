const iaService = require('../services/iaService');

const iaController = {

    // POST /ia/buscar - Busca com linguagem natural
    async buscar(req, res) {
        try {
            const { pergunta } = req.body;
            const userId = req.userId;
            const userPerfil = req.userPerfil;
            const userSetorId = req.userSetorId;

            if (!pergunta || pergunta.trim() === '') {
                return res.status(400).json({ erro: 'Pergunta é obrigatória' });
            }

            const resultado = await iaService.processarPergunta(
                pergunta.trim(),
                userId,
                userPerfil,
                userSetorId
            );

            return res.json(resultado);

        } catch (error) {
            console.error('Erro na busca com IA:', error);
            return res.status(500).json({ erro: 'Erro ao processar busca' });
        }
    },

    // POST /ia/sugestoes - Sugestões de perguntas
    async sugestoes(req, res) {
        try {
            const sugestoes = [
                "Mostrar protocolos em trânsito",
                "Protocolos recebidos essa semana",
                "Documentos enviados para a PROG",
                "Protocolos do tipo Ofício",
                "Protocolos arquivados esse mês",
                "Mostrar todos os memorandos",
                "Protocolos criados hoje",
                "Documentos aguardando no DCOMP"
            ];

            return res.json({ sugestoes });

        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao buscar sugestões' });
        }
    }
};

module.exports = iaController;