# Passo a Passo de como explorar as vulnerabilidades apresentadas no src_vuln/

## 1-ENUMERAÇÃO DE USUÁRIOS
- Em primeiro momento podemos ver que o formulário de login responde de maneira diferente ao ter um usuário e senha incorreto e apenas uma senha incorreta.
- Isso indica uma vulnerabilidade com ID 'WSTG-IDNT-04'* de acordo com o Web Security Testing Guide do OWASP.
- Vamos testar essa vulnerabilidade no tipo de teste black box

- Podemos utilizar ferramentas prontas como o wfuzz, ffuf, gobuster, feroxbuster etc.
### Instalação:
'''pip3 install wfuzz''' ou ''' git clone https://github.com/xmendez/wfuzz.git '''

### Podemos usar fuf (DIY):
'''
Algum codigo muito louco <rockyou.txt>
'''



*link para aprofundamento: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
