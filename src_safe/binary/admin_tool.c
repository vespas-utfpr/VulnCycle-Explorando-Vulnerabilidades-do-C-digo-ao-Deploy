#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void notas_para_desenvolvedor()
{
    printf("\n[!] INFORMAÇOES PARA O DESENVOLVEDOR!\n");
    printf("[!] Carregando Informações...\n\n");
    printf("para R0SSETT0: Cuidado ao usar scanf sem limite de caracteres!!");
    printf("para VESPAS-UTFPR: Vamos estudar exploração binária para antecipar usuários maliciosos!");
}

// Função para executar comandos permitidos
void executar_comando(const char *cmd)
{
    if (strncmp(cmd, "admin:", 6) != 0)
    {
        printf("[-] Erro: Comando deve começar com 'admin:'\n");
        return;
    }

    const char *comando_real = cmd + 6; // Remove o prefixo "admin:"

    if (strcmp(comando_real, "ls") == 0)
    {
        printf("[+] Executando: ls\n");
        system("ls -la");
    }
    else if (strcmp(comando_real, "whoami") == 0)
    {
        printf("[+] Executando: whoami\n");
        system("whoami");
    }
    else
    {
        printf("[-] Comando não permitido! Apenas 'ls' e 'whoami' são aceitos.\n");
    }
}

int main()
{
    char buffer[13];
    char comando[128];

    printf("Digite seu nome de usuário: ");
    fflush(stdout);

    // Permite buffer overflow para controlar RIP e fazer ret2win
    scanf("%12s", buffer);

    printf("Bem-vindo, %s!\n\n", buffer);

    while (1)
    {
        printf("admin@system:~$ ");
        fflush(stdout);

        if (fgets(comando, sizeof(comando), stdin) == NULL)
        {
            break;
        }

        // Remove newline
        comando[strcspn(comando, "\n")] = 0;

        if (strcmp(comando, "quit") == 0)
        {
            printf("Encerrando sessão...\n");
            break;
        }

        if (strlen(comando) == 0)
        {
            continue;
        }

        executar_comando(comando);
        printf("\n");
    }

    return 0;
}