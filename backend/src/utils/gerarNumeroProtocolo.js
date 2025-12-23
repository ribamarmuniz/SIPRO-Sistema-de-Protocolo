const db = require('../config/database');

function gerarNumeroProtocolo() {
    const ano = new Date().getFullYear();
    
    // Buscar o último número do ano atual
    const ultimo = db.prepare(`
        SELECT numero_protocolo FROM protocolos 
        WHERE numero_protocolo LIKE ?
        ORDER BY id DESC LIMIT 1
    `).get(`%/${ano}`);

    let sequencial = 1;

    if (ultimo) {
        // Extrai o número sequencial (ex: "00001/2024" -> 1)
        const partes = ultimo.numero_protocolo.split('/');
        sequencial = parseInt(partes[0]) + 1;
    }

    // Formata com zeros à esquerda (5 dígitos)
    const numeroFormatado = sequencial.toString().padStart(5, '0');
    
    return `${numeroFormatado}/${ano}`;
}

module.exports = gerarNumeroProtocolo;