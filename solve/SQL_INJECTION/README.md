# SQL INJECTION

Para reconhecer o sql injection podemos dar input no caracter "'" e observar que ocorre um erro interno no servidor

com isso podemos elaborar uma query para injetarmos


``` admin' -- -```

Passando os caracteres "-- -" comentamos o resto da linha quanto é um sqlite3

Existem maneiras de reconhecer o SGBD de acordo com o erro veja mais em: https://www.invicti.com/blog/web-security/sql-injection-cheat-sheet/
