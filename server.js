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
    
    db.all(query, (err, messages) => {
        if (err) {
            res.status(500).json({ error: 'Erro no banco de dados' });
            return;
        }
        res.json(messages);
    });
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