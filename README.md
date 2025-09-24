# Aplicação Web Vulnerável - Nova

Uma aplicação web propositalmente vulnerável para fins educativos e demonstração de vulnerabilidades de segurança.

## ⚠️ AVISO IMPORTANTE

Esta aplicação contém **vulnerabilidades de segurança intencionais** e deve ser usada **apenas para fins educativos** em um ambiente controlado. **NUNCA** use este código em produção ou exponha esta aplicação na internet.

## 🎯 Objetivo

Demonstrar vulnerabilidades comuns em aplicações web para:
- Educação em segurança cibernética
- Treinamento em testes de penetração
- Compreensão de falhas de segurança

## 🔓 Vulnerabilidades Implementadas

### 1. SQL Injection
- **Localização:** Endpoint `/login`
- **Descrição:** Consulta SQL não preparada permite injeção de código
- **Teste:** Use `' OR '1'='1` como usuário

### 2. Weak Authentication
- **Localização:** Credenciais padrão
- **Descrição:** Senhas fracas e previsíveis
- **Credenciais:** admin/admin123, user1/password, guest/123456

### 3. Session Management Issues
- **Localização:** Configuração de sessão
- **Descrição:** Chave de sessão fraca e cookies inseguros

### 4. Authorization Bypass
- **Localização:** Verificações de acesso
- **Descrição:** Controles de acesso inadequados

### 5. Information Disclosure
- **Localização:** Endpoint `/debug`
- **Descrição:** Exposição de informações sensíveis do sistema

### 6. Insecure Direct Object References (IDOR)
- **Localização:** API `/api/messages`
- **Descrição:** Possível acesso a mensagens de outros usuários

### 7. Buffer Overflow (Binário C)
- **Localização:** Ferramenta administrativa (`admin_tool`)
- **Descrição:** Vulnerabilidade de buffer overflow com possibilidade de ROP
- **Função alvo:** `acessar_shell()` - concede shell administrativa

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm

### Passos para executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar a aplicação:**
   ```bash
   npm start
   ```
   
   Ou para desenvolvimento com auto-reload:
   ```bash
   npm run dev
   ```

3. **Acessar a aplicação:**
   - Abra o navegador em: `http://localhost:3000`

## 👤 Credenciais de Teste

| Usuário | Senha | Função |
|---------|-------|--------|
| admin | admin123 | Administrador |
| user1 | password | Usuário |
| guest | 123456 | Usuário |

## 🎮 Como Testar as Vulnerabilidades

### SQL Injection
1. Na página de login, digite: `' OR '1'='1` no campo usuário
2. Qualquer senha funcionará
3. Você será logado como o primeiro usuário do banco (admin)

### IDOR (Insecure Direct Object Reference)
1. Faça login como usuário comum
2. Acesse: `http://localhost:3000/api/messages?user_id=1`
3. Você verá mensagens do admin

### Information Disclosure
1. Acesse: `http://localhost:3000/debug`
2. Verá informações sensíveis da sessão e cabeçalhos

### Buffer Overflow (Exploração Avançada)
1. Faça login como admin
2. Acesse o Dashboard e use a "Ferramenta Administrativa"
3. Use o gerador de exploit: `python3 exploit_generator.py`
4. Execute o payload gerado para obter shell administrativa

**Exemplo de comando:**
```bash
# Gerar exploit
python3 exploit_generator.py generate

# Compilar ferramenta (se necessário)
make

# Teste básico de overflow
./admin_tool "admin:$(python3 -c 'print("A"*80)')"
```

## 📁 Estrutura do Projeto

```
nova/
├── server.js              # Servidor principal com vulnerabilidades
├── package.json           # Dependências do projeto
├── database.db           # Banco SQLite (criado automaticamente)
├── admin_tool.c          # Código fonte da ferramenta administrativa (vulnerável)
├── admin_tool            # Binário compilado (vulnerável a buffer overflow)
├── exploit_generator.py  # Gerador de exploits para buffer overflow
├── Makefile             # Build system para compilar admin_tool
├── public/               # Arquivos estáticos
│   ├── login.html        # Página de login
│   ├── dashboard.html    # Dashboard do admin (inclui ferramenta C)
│   ├── messages.html     # Página de mensagens
│   └── style.css         # Estilos CSS
└── README.md            # Este arquivo
```

## 🛡️ Uso Responsável

Esta aplicação foi criada exclusivamente para:
- ✅ Educação em segurança
- ✅ Treinamento em ambiente controlado
- ✅ Demonstrações acadêmicas
- ✅ Testes de penetração autorizados

**NÃO use para:**
- ❌ Ataques reais
- ❌ Ambientes de produção
- ❌ Fins maliciosos
- ❌ Exposição na internet

## 🔧 Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Banco de dados:** SQLite3
- **Frontend:** HTML, CSS, JavaScript
- **Sessões:** express-session
- **Binário vulnerável:** C (admin_tool) com buffer overflow
- **Exploit development:** Python 3 (exploit_generator.py)

## 📚 Recursos Educativos

Para aprender mais sobre as vulnerabilidades demonstradas:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## ⚖️ Licença

MIT License - Use apenas para fins educativos e éticos.

---

**Lembre-se: Com grandes poderes vêm grandes responsabilidades. Use este conhecimento para tornar a web mais segura! 🛡️**