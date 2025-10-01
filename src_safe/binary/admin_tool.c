#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int notas_para_desenvolvedor()
{
    printf("\n[!] INFORMAÇOES PARA O DESENVOLVEDOR!\n");
    printf("[!] Carregando Informações...\n\n");
    printf("para R0SSETT0: Cuidado ao usar scanf sem limite de caracteres!!\n");
    printf("para VESPAS-UTFPR: Vamos estudar exploração binária para antecipar usuários maliciosos!\n");
    return 0;
}

int main()
{
    char buffer[13];

    printf("Digite seu nome de usuário: ");
    fflush(stdout);

    // corrigimos o tanto que pode ser lido no buffer
    scanf("%12s", buffer);

    printf("Bem-vindo, %s!\n\n", buffer);

    return 0;
}