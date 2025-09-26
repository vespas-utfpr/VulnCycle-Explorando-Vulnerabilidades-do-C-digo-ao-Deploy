# Guia de Acesso ao Centro de Download de Binários

## 🎯 Como Acessar

### 1. Via Interface Web
1. Faça login como administrador (admin / admin123)
2. No Dashboard, clique em "📦 Acessar Centro de Download"
3. Ou acesse diretamente: `http://localhost:3000/binary`

### 2. URLs Diretas de Download

#### Binário Executável:
```
http://localhost:3000/binary/admin_tool
```

#### Código Fonte C:
```
http://localhost:3000/binary/admin_tool.c
```

#### Script de Exploit:
```
http://localhost:3000/binary/exploit_generator.py
```

#### Informações Técnicas (JSON):
```
http://localhost:3000/binary/info
```

#### Documentação:
```
http://localhost:3000/binary/README.md
```

## 🔍 Análise do Binário

### Comandos Básicos:
```bash
# Download via curl
curl -O http://localhost:3000/binary/admin_tool
curl -O http://localhost:3000/binary/admin_tool.c

# Tornar executável (se necessário)
chmod +x admin_tool

# Verificar tipo de arquivo
file admin_tool

# Verificar proteções de segurança
checksec admin_tool  # Requer peda/gef no gdb

# Informações básicas
ls -la admin_tool
```

### Análise Estática:
```bash
# Disassembly completo
objdump -d admin_tool > admin_tool.asm

# Strings interessantes
strings admin_tool

# Headers ELF
readelf -h admin_tool
readelf -S admin_tool  # Seções
readelf -s admin_tool  # Símbolos

# Radare2 (análise avançada)
r2 admin_tool
> aaa    # Análise automática
> pdf @main  # Disassembly da função main
> s sym.acessar_shell  # Ir para função alvo
> pdf    # Disassembly da função atual
```

### Debug Dinâmico:
```bash
# GDB básico
gdb admin_tool
(gdb) disas main
(gdb) disas acessar_shell
(gdb) info functions

# Encontrar offset para overflow
(gdb) run admin:$(python3 -c 'print("A"*100)')
# Analisar onde o programa quebrou
```

## 🎯 Objetivos da Engenharia Reversa

### 1. Identificar Vulnerabilidades:
- **Buffer Overflow** na função `processar_comando_admin()`
- **Format String** na função `debug_info()`
- Falta de proteções (ASLR, Stack Canaries, NX bit)

### 2. Encontrar Função Alvo:
- **Função:** `acessar_shell()`
- **Objetivo:** Executar esta função via ROP
- **Endereço:** Encontrar com `objdump -d admin_tool | grep acessar_shell`

### 3. Calcular Offset:
- Buffer de 64 bytes na função vulnerável
- Encontrar quantos bytes necessários para sobrescrever RIP
- Padrão típico: 64 bytes + 8 bytes (saved RBP) + 8 bytes (return address)

### 4. Desenvolver Exploit:
```python
# Exemplo de estrutura do payload
payload = b"A" * 72  # Offset até return address
payload += b"\x41\x41\x41\x41\x41\x41\x41\x41"  # Endereço de acessar_shell()
```

## 🚨 Vulnerabilidade de Segurança

### Impacto da Exposição de Binários:

1. **Análise Offline:** Atacantes podem analisar sem detectar
2. **Engenharia Reversa:** Descobrir vulnerabilidades e lógica
3. **Desenvolvimento de Exploits:** Criar payloads específicos
4. **Bypass de Proteções:** Identificar e contornar medidas de segurança

### Em Ambientes Reais:
- ❌ **NUNCA** exponha binários executáveis
- ❌ Evite debug symbols em produção
- ❌ Não forneça código fonte
- ❌ Não exponha ferramentas administrativas

### Medidas de Proteção:
- ✅ ASLR (Address Space Layout Randomization)
- ✅ Stack Canaries
- ✅ NX bit (No Execute)
- ✅ PIE (Position Independent Executable)
- ✅ RELRO (Relocation Read-Only)

## 🎓 Valor Educativo

Este centro de binários demonstra:

1. **Como binários podem ser expostos** inadvertidamente
2. **Processo completo de engenharia reversa**
3. **Técnicas de análise estática e dinâmica**
4. **Desenvolvimento de exploits práticos**
5. **Importância das proteções de segurança**

Use esta funcionalidade para aprender sobre segurança binária de forma prática e controlada!