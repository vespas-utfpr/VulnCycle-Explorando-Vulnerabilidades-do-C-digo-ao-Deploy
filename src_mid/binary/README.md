# Centro de Download de Binários

Este diretório contém binários executáveis disponíveis para download e análise.

## Arquivos Disponíveis

### admin_tool
- **Tipo:** Executável ELF 64-bit
- **Vulnerabilidades:** Buffer Overflow, Format String
- **URL:** `/binary/admin_tool`
- **Descrição:** Ferramenta administrativa com vulnerabilidades intencionais

### Código Fonte
- **admin_tool.c** - Código fonte da ferramenta
- **exploit_generator.py** - Script para gerar exploits

## Comandos de Análise Recomendados

```bash
# Informações básicas do arquivo
file admin_tool
ls -la admin_tool

# Verificar proteções de segurança
checksec admin_tool

# Disassembly
objdump -d admin_tool
radare2 admin_tool

# Debug dinâmico
gdb admin_tool

# Análise de strings
strings admin_tool

# Headers ELF
readelf -h admin_tool
```

## Exploração

O binário contém vulnerabilidades intencionais que podem ser exploradas para:
- Buffer Overflow
- ROP Chains
- Acesso à função shell

**Função alvo:** `acessar_shell()`

## ⚠️ Aviso de Segurança

Este diretório representa uma **vulnerabilidade crítica** em sistemas reais:
- Exposição de binários executáveis
- Facilita engenharia reversa
- Permite desenvolvimento de exploits offline
- Revela arquitetura e proteções do sistema