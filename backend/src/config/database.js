const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.db');

let db = null;
let inicializado = false;
let salvando = false;

// Função para salvar o banco no disco
function salvarBanco() {
    if (db && !salvando) {
        salvando = true;
        try {
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
        } catch (e) {
            console.error('Erro ao salvar banco:', e);
        }
        salvando = false;
    }
}

// Função para inicializar o banco
async function inicializarBanco() {
    if (inicializado) return;
    
    const SQL = await initSqlJs();
    
    // Verifica se o banco já existe
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
        console.log('✅ Banco de dados carregado!');
    } else {
        db = new SQL.Database();
        console.log('✅ Novo banco de dados criado!');
    }

    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    inicializado = true;

    // Salvar a cada 3 segundos
    setInterval(salvarBanco, 3000);

    // Salvar ao encerrar o processo
    process.on('exit', salvarBanco);
    process.on('SIGINT', () => {
        console.log('\n💾 Salvando banco de dados...');
        salvarBanco();
        process.exit();
    });
    process.on('SIGTERM', () => {
        console.log('\n💾 Salvando banco de dados...');
        salvarBanco();
        process.exit();
    });

    return db;
}

// Wrapper para manter compatibilidade
const dbWrapper = {
    prepare: (sql) => ({
        run: (...params) => {
            if (!db) throw new Error('Banco não inicializado');
            try {
                db.run(sql, params);
                salvarBanco(); // Salva imediatamente após alterações
                const result = db.exec("SELECT last_insert_rowid() as id");
                return { 
                    lastInsertRowid: result.length > 0 ? result[0].values[0][0] : 0 
                };
            } catch (e) {
                console.error('Erro SQL:', e.message);
                throw e;
            }
        },
        get: (...params) => {
            if (!db) throw new Error('Banco não inicializado');
            try {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                if (stmt.step()) {
                    const row = stmt.getAsObject();
                    stmt.free();
                    return row;
                }
                stmt.free();
                return undefined;
            } catch (e) {
                // Não loga erro para queries de leitura que não encontram dados
                return undefined;
            }
        },
        all: (...params) => {
            if (!db) throw new Error('Banco não inicializado');
            try {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                const results = [];
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                return results;
            } catch (e) {
                // Não loga erro para queries de leitura
                return [];
            }
        }
    }),
    exec: (sql) => {
        if (!db) throw new Error('Banco não inicializado');
        db.run(sql);
        salvarBanco(); // Salva imediatamente após alterações
    },
    pragma: (sql) => {
        if (!db) throw new Error('Banco não inicializado');
        db.run(`PRAGMA ${sql}`);
    }
};

// Aguardar inicialização
const aguardarInicializacao = async () => {
    if (!inicializado) {
        await inicializarBanco();
    }
    return true;
};

module.exports = dbWrapper;
module.exports.aguardarInicializacao = aguardarInicializacao;
module.exports.inicializarBanco = inicializarBanco;
module.exports.salvarBanco = salvarBanco;