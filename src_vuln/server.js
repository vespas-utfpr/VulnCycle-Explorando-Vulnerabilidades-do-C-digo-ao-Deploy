const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');


const app = express();
const PORT = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'senha-fraca',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
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

    // Inserir usuários padrão
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES 
        ('admin', 'admin123', 'admin'),
        ('user1', 'password', 'user'),
        ('guest', '123456', 'user'
    )`);

    // Inserir mensagem
    db.run(`INSERT OR IGNORE INTO messages (id, user_id, title, content, created_at) VALUES 
        (1, 1, 'Welcome', 'Seja bem vindo', '2024-12-03 00:00:00'
    )`);
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
    const checkuser = `SELECT * FROM users WHERE username = '${username}'`;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.get(checkuser, (err, user) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }

        if (user) {
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
                    res.send('<script>alert("Senha incorreta."); window.location="/";</script>');
                }
            });
        } else {
            res.send('<script>alert("Usuário não cadastrado."); window.location="/";</script>');
        }
    });
});

// Dashboard do Admin
app.get('/dashboard', (req, res) => {

    if (!req.session.user || req.session.user.role !== 'admin') {
        res.redirect('/');
        return;
    }
    
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API para obter todos os usuários (apenas admin)
app.get('/api/users', (req, res) => {

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

// Página de mensagens
app.get('/messages', (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
    }
    else if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'admin-messages.html'));
    }
    else {
        res.sendFile(path.join(__dirname, 'public', 'messages.html'));
    }
});

// API para obter mensagens
app.get('/api/messages', (req, res) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }
        
    const query = `SELECT * FROM messages`;

    db.all(query, (err, messages) => {
        if (err) {
            res.status(500).json({ error: 'Erro no banco de dados' });
            return;
        }
        res.json(messages);
    });
});

// Rota para criar nova mensagem - VULNERÁVEL A XSS STORED
app.post('/create-message', (req, res) => {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    
    const { title, content } = req.body;
    const userId = req.session.user.id;
    
    if (!title || !content) {
        // Vulnerabilidade XSS STORED: dados não sanitizados guardados na resposta
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

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Global process management for admin_tool
let globalAdminTool = null;
let isInitialized = false;

// Rota para executar ferramenta administrativa em C (vulnerável a buffer overflow)
app.post('/admin-tool', (req, res) => {
    if (!req.session.user) {
        return res.status(403).json({ error: 'Acesso negado - apenas administradores' });
    }
    
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: 'Nome de usuário não fornecido' });
    }
    
    // Initialize process only once
    if (!globalAdminTool || globalAdminTool.killed) {
        globalAdminTool = spawn('./binary/admin_tool', [], {
            cwd: __dirname
        });
        
        globalAdminTool.on('close', (code) => {
            console.log('Admin tool process closed with code:', code);
            globalAdminTool = null;
        });
        
        globalAdminTool.on('error', (err) => {
            console.error('Admin tool process error:', err);
            globalAdminTool = null;
        });
    }
    
    // Send the username to the tool
    globalAdminTool.stdin.write(username + '\n');
    
    let output = '';
    let error = '';
    
    // Set up temporary listeners for this request
    const outputHandler = (data) => {
        output += data.toString();
    };
    
    const errorHandler = (data) => {
        error += data.toString();
    };
    
    // ... after attaching listeners
    globalAdminTool.stdout.on('data', outputHandler);
    globalAdminTool.stderr.on('data', errorHandler);

    // Wait for the tool to respond with the name
    setTimeout(() => {
        // Defensive: check that globalAdminTool still exists and has streams
        try {
            if (globalAdminTool && globalAdminTool.stdout && !globalAdminTool.killed) {
                globalAdminTool.stdout.removeListener('data', outputHandler);
            }
            if (globalAdminTool && globalAdminTool.stderr && !globalAdminTool.killed) {
                globalAdminTool.stderr.removeListener('data', errorHandler);
            }
        } catch (e) {
            console.error('Erro ao remover listeners do adminTool:', e);
        }

        res.json({
            username: username,
            output: output,
            error: error
        });
    }, 1000);
});

// Rota para download do binário admin_tool
app.get('/admin_tool', (req, res) => {
    const filePath = path.join(__dirname, '/binary/admin_tool');
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send(`
            <html>
                <body>
                    <h1>Arquivo não encontrado</h1>
                    <p>O binário admin_tool não foi encontrado.</p>
                    <p>Execute 'make' para compilar o binário.</p>
                    <a href="/binary">← Voltar</a>
                </body>
            </html>
        `);
    }
    
    // Definir headers para download
    res.setHeader('Content-Disposition', 'attachment; filename="admin_tool"');
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Enviar o arquivo
    res.sendFile(filePath);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('ATENÇÃO: Esta é uma aplicação PROPOSITALMENTE VULNERÁVEL para fins educativos!');
});