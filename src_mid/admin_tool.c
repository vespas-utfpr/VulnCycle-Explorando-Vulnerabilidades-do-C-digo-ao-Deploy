#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

// Função que deve ser chamada via ROP para obter shell
void acessar_shell() {
    printf("🚨 SHELL ADMINISTRATIVA ACESSADA! 🚨\n");
    printf("Executando /bin/bash...\n");
    system("/bin/bash");
}

// Função vulnerável com buffer overflow
void processar_comando_admin(char *input) {
    char buffer[64];  // Buffer pequeno - vulnerável
    printf("Processando comando administrativo...\n");
    
    // Vulnerabilidade: strcpy sem verificação de tamanho
    strcpy(buffer, input);
    
    printf("Comando processado: %s\n", buffer);
}

// Função para listar usuários (funcionalidade legítima)
void listar_usuarios() {
    printf("=== LISTA DE USUÁRIOS ===\n");
    printf("1. admin (Administrator)\n");
    printf("2. user1 (User)\n");
    printf("3. guest (User)\n");
    printf("========================\n");
}

// Função para verificar logs (funcionalidade legítima)
void verificar_logs() {
    printf("=== LOGS DO SISTEMA ===\n");
    printf("[INFO] Sistema iniciado\n");
    printf("[WARN] Tentativas de login suspeitas detectadas\n");
    printf("[INFO] Backup realizado com sucesso\n");
    printf("======================\n");
}

int main(int argc, char *argv[]) {
    // Desabilitar proteções para demonstração educativa
    setvbuf(stdout, NULL, _IONBF, 0);
    
    printf("🔧 FERRAMENTA ADMINISTRATIVA - NOVA CTF 🔧\n");
    printf("==========================================\n");
    
    if (argc != 2) {
        printf("Uso: %s <comando>\n", argv[0]);
        printf("Comandos disponíveis:\n");
        printf("  users    - Listar usuários\n");
        printf("  logs     - Verificar logs\n");
        printf("  admin    - Executar comando administrativo\n");
        printf("\n💡 Dica de Exploração:\n");
        printf("Para buffer overflow, use um payload longo com o comando 'admin'\n");
        printf("Endereço da função acessar_shell: %p\n", acessar_shell);
        return 1;
    }
    
    char *comando = argv[1];
    
    if (strcmp(comando, "users") == 0) {
        listar_usuarios();
    } 
    else if (strcmp(comando, "logs") == 0) {
        verificar_logs();
    }
    else if (strncmp(comando, "admin", 5) == 0) {
        // Extrai o resto do comando após "admin:"
        if (strlen(comando) > 6 && comando[5] == ':') {
            processar_comando_admin(comando + 6);
        } else {
            printf("Formato do comando admin: admin:<seu_payload>\n");
        }
    }
    else {
        printf("Comando inválido: %s\n", comando);
        return 1;
    }
    
    return 0;
}