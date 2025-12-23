const model = require('../config/gemini');
const db = require('../config/database');

const iaService = {

    async processarPergunta(pergunta, userId, userPerfil, userSetorId) {
        try {
            console.log('Processando pergunta:', pergunta);
            
            // Buscar dados do banco para contexto
            const setores = db.prepare('SELECT id, nome, sigla FROM setores WHERE ativo = 1').all();
            const tiposDocumento = db.prepare('SELECT id, nome FROM tipos_documento WHERE ativo = 1').all();
            
            console.log('Setores encontrados:', setores.length);
            console.log('Tipos encontrados:', tiposDocumento.length);

            const dataAtual = new Date().toISOString().split('T')[0];
            
            // Prompt similar ao seu código que funcionou
            const prompt = `
Você é um especialista em SQLite para o sistema de protocolos da UEMA.
Dada uma pergunta em linguagem natural, gere APENAS uma query SQL SELECT.

SCHEMA DO BANCO:
- protocolos: id, numero_protocolo, assunto, descricao, status, tipo_documento_id, remetente_id, setor_origem_id, setor_destino_id, criado_em, arquivo_url
- usuarios: id, nome, email, perfil, setor_id
- setores: id, nome, sigla
- tipos_documento: id, nome

STATUS POSSÍVEIS: 'aguardando', 'em_transito', 'recebido', 'arquivado'

SETORES DISPONÍVEIS:
${setores.map(s => `ID ${s.id}: ${s.sigla} - ${s.nome}`).join('\n')}

TIPOS DE DOCUMENTO:
${tiposDocumento.map(t => `ID ${t.id}: ${t.nome}`).join('\n')}

DATA ATUAL: ${dataAtual}

REGRAS:
1. Use LIKE com % para buscas de texto
2. Para "hoje", use DATE(criado_em) = '${dataAtual}'
3. Para "essa semana", use DATE(criado_em) >= date('${dataAtual}', '-7 days')
4. Para "esse mês", use strftime('%Y-%m', criado_em) = strftime('%Y-%m', '${dataAtual}')
5. Sempre faça JOINs para trazer nomes dos setores e tipos
6. Limite em 50 resultados
7. Ordene por criado_em DESC
8. Responda APENAS com o SQL, sem explicações, sem markdown

EXEMPLO DE QUERY:
SELECT p.*, td.nome as tipo_documento_nome, so.sigla as setor_origem_sigla, sd.sigla as setor_destino_sigla, u.nome as remetente_nome
FROM protocolos p
LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
LEFT JOIN setores so ON p.setor_origem_id = so.id
LEFT JOIN setores sd ON p.setor_destino_id = sd.id
LEFT JOIN usuarios u ON p.remetente_id = u.id
WHERE p.status = 'em_transito'
ORDER BY p.criado_em DESC
LIMIT 50

PERGUNTA DO USUÁRIO: "${pergunta}"

Gere apenas o SQL:`;

            console.log('📤 Enviando para Gemini...');
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let sqlQuery = response.text();
            
            console.log('Resposta da IA:', sqlQuery);
            
            // Limpar a query
            sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').replace(/SQLQuery:/g, '').trim();
            
            // Verificar se é um SELECT válido
            if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
                throw new Error('Query inválida gerada');
            }

            console.log('Executando SQL:', sqlQuery);
            
            // Executar a query
            const protocolos = db.prepare(sqlQuery).all();
            
            console.log('Protocolos encontrados:', protocolos.length);
            
            return {
                sucesso: true,
                pergunta: pergunta,
                explicacao: `Busca realizada com sucesso para: "${pergunta}"`,
                filtrosAplicados: { sqlGerado: sqlQuery },
                resultados: protocolos,
                totalResultados: protocolos.length
            };

        } catch (error) {
            console.error('Erro ao processar pergunta:', error.message);
            
            // Se der erro, tenta uma busca simples
            try {
                console.log('Tentando busca simples...');
                const protocolos = await this.buscaSimples(pergunta, userId, userPerfil, userSetorId);
                return {
                    sucesso: true,
                    pergunta: pergunta,
                    explicacao: `Busca por texto: "${pergunta}"`,
                    filtrosAplicados: { busca: pergunta },
                    resultados: protocolos,
                    totalResultados: protocolos.length
                };
            } catch (e) {
                return {
                    sucesso: false,
                    erro: 'Não consegui processar sua busca. Tente termos mais simples.',
                    pergunta: pergunta
                };
            }
        }
    },

    async buscaSimples(pergunta, userId, userPerfil, userSetorId) {
        let query = `
            SELECT 
                p.*,
                td.nome as tipo_documento_nome,
                u.nome as remetente_nome,
                so.sigla as setor_origem_sigla,
                sd.sigla as setor_destino_sigla
            FROM protocolos p
            LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
            LEFT JOIN usuarios u ON p.remetente_id = u.id
            LEFT JOIN setores so ON p.setor_origem_id = so.id
            LEFT JOIN setores sd ON p.setor_destino_id = sd.id
            WHERE (
                p.numero_protocolo LIKE ? OR 
                p.assunto LIKE ? OR 
                p.descricao LIKE ? OR
                so.sigla LIKE ? OR
                sd.sigla LIKE ? OR
                td.nome LIKE ?
            )
            ORDER BY p.criado_em DESC
            LIMIT 50
        `;

        const termo = `%${pergunta}%`;
        return db.prepare(query).all(termo, termo, termo, termo, termo, termo);
    }
};

module.exports = iaService;