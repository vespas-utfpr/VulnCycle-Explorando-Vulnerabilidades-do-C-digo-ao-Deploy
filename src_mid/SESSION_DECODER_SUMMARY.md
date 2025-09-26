# Session Cookie Decoding - Implementação Completa

## ✅ Ferramentas Implementadas

### 1. **session-decoder.js** (Node.js)
Decodificador completo de session cookies com:
- ✅ Decodificação com chave conhecida
- ✅ Força bruta em chaves comuns  
- ✅ Criação de cookies falsos
- ✅ Suporte a URL encoding
- ✅ Verificação de assinaturas HMAC-SHA256

### 2. **session-decoder.py** (Python)
Implementação alternativa com funcionalidades adicionais:
- ✅ Extração de cookies de requisições HTTP
- ✅ Interface de linha de comando amigável
- ✅ Tratamento de encoding automatizado

### 3. **session-demo.js** (Demonstração)
Script educativo que demonstra:
- ✅ Criação de diferentes tipos de sessões
- ✅ Session Hijacking prático
- ✅ Session Fixation
- ✅ Análise de vulnerabilidades

## 🎯 Funcionalidades Principais

### **Decodificação Automática**
```bash
# Força bruta automática
./session-decoder.js "s:cookie_value.signature"

# Com chave específica  
./session-decoder.js "cookie_value" "secret-key"
```

### **Criação de Cookies Falsos**
```bash
# Cookie administrativo falso
./session-decoder.js --create '{"user":{"id":1,"username":"admin","role":"admin"}}'

# Cookie personalizado
python3 session-decoder.py --create
```

### **Extração de Requisições**
```bash
# Extrair cookie de texto HTTP
python3 session-decoder.py --extract "Cookie: connect.sid=value"
```

## 🚨 Vulnerabilidades Demonstradas

### **1. Chave Secreta Fraca**
- **Chave atual:** `weak-secret-key`
- **Problema:** Facilmente descoberta por força bruta
- **Impacto:** Decodificação e falsificação de sessões

### **2. Dados Sensíveis em Cookies**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "password": "admin123",  // ❌ NUNCA armazenar senhas
    "role": "admin"
  }
}
```

### **3. Session Hijacking**
- **Método:** Interceptação e modificação de cookies
- **Demonstração:** Script cria versões maliciosas válidas
- **Impacto:** Personificação de usuários

### **4. Session Fixation** 
- **Método:** Forçar vítima a usar sessão pré-definida
- **Demonstração:** Cookies fixados com timestamps
- **Impacto:** Controle total da sessão da vítima

## 🧪 Testes Práticos

### **Cenário 1: Interceptação de Cookie**
```bash
# 1. Capturar cookie legítimo
curl -c cookies.txt -X POST -d "username=admin&password=admin123" http://localhost:3000/login

# 2. Extrair cookie
grep connect.sid cookies.txt | cut -f7

# 3. Decodificar
./session-decoder.js "cookie_capturado"
```

### **Cenário 2: Session Hijacking**
```bash
# 1. Criar cookie malicioso
./session-decoder.js --create '{"user":{"id":999,"username":"hacker","role":"admin"}}'

# 2. Usar cookie para acessar admin
curl -H "Cookie: connect.sid=cookie_malicioso" http://localhost:3000/dashboard
```

### **Cenário 3: Análise de Força Bruta**
```bash
# Testar múltiplas chaves automaticamente
for secret in secret admin password key; do
    echo "Testando: $secret"
    ./session-decoder.js "cookie_value" "$secret"
done
```

## 📊 Resultados da Demonstração

### **Cookies Criados com Sucesso:**
- ✅ Admin Session: `s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIi...`
- ✅ User Session: `s:eyJ1c2VyIjp7ImlkIjoyLCJ1c2VybmFtZSI6InVzZXIxI...`
- ✅ Malicious Session: `s:eyJ1c2VyIjp7ImlkIjo5OTksInVzZXJuYW1lIjoiaGF...`

### **Decodificação Bem-Sucedida:**
```
Chave encontrada: weak-secret-key
Dados extraídos: {username: "admin", role: "admin", password: "admin123"}
Tempo de força bruta: < 1 segundo
```

### **Vulnerabilidades Confirmadas:**
- 🔴 Chave secreta previsível
- 🔴 Dados sensíveis expostos  
- 🔴 Possibilidade de falsificação
- 🔴 Session hijacking viável

## 🛡️ Medidas de Proteção Recomendadas

### **1. Chave Secreta Forte**
```javascript
// ❌ Atual (vulnerável)
secret: 'weak-secret-key'

// ✅ Recomendado
secret: crypto.randomBytes(32).toString('hex')
```

### **2. Configuração Segura**
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET, // Variável de ambiente
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,      // HTTPS only
        httpOnly: true,    // Não acessível via JavaScript
        maxAge: 1800000,   // 30 minutos
        sameSite: 'strict' // Proteção CSRF
    }
}));
```

### **3. Armazenamento Seguro**
```javascript
// ❌ Não armazenar dados sensíveis
req.session.user = {password: "admin123"};

// ✅ Apenas referências
req.session.userId = user.id;
```

### **4. Validação Adicional**
```javascript
// Validar origem e integridade
if (req.session.userId) {
    const user = await getUserById(req.session.userId);
    if (!user || user.lastLogin !== req.session.loginTime) {
        req.session.destroy();
        return res.redirect('/login');
    }
}
```

## 🎓 Valor Educativo

Esta implementação demonstra:

1. **Como funciona a criptografia de sessões** Express.js
2. **Técnicas de força bruta** em chaves fracas
3. **Impactos reais** de configurações inseguras
4. **Métodos de falsificação** de sessões
5. **Importância de medidas preventivas**

## 📁 Arquivos Criados

```
/home/augusto/Semana_academica/
├── session-decoder.js          # Decodificador principal (Node.js)
├── session-decoder.py          # Decodificador alternativo (Python) 
├── session-demo.js             # Demonstração educativa
└── SESSION_COOKIE_GUIDE.md     # Guia completo de uso
```

## 🚀 Próximos Passos

Para expandir esta demonstração:
1. **Implementar ataque automatizado** completo
2. **Criar payloads XSS** para roubo de cookies
3. **Demonstrar CSRF** com session fixation
4. **Adicionar timing attacks** na validação
5. **Implementar bypass** de proteções básicas

---

## ✅ Status: Implementação Completa

O sistema de **decodificação de session cookies** está totalmente implementado e funcional, demonstrando de forma prática as vulnerabilidades de gerenciamento de sessão em aplicações web.