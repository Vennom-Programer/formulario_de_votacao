## Autenticação

Configure `AUTH_SECRET` com pelo menos 32 bytes aleatórios no ambiente do backend.
Uma opção para gerar o valor localmente é `openssl rand -hex 32`.
Antes de iniciar o servidor, aplique a migração à tabela `usuario`:

```sh
node scripts/migrate-auth.js
```

A migração adiciona `id_usuario` como chave primária, libera `matricula` para
visitantes, converte `cpf` para `VARCHAR(11)` (necessário para guardar os 11
dígitos sem perda) e cria índices únicos para e-mail, CPF e matrícula. CPF e
matrícula são armazenados somente no campo correspondente ao tipo de cadastro.

Rotas:

- `POST /api/auth/cadastro`: recebe `tipo` (`visitante` ou `aluno`), `nome`,
  `email`, `senha`, `confirmarSenha` e CPF ou matrícula.
- `POST /api/auth/login`: recebe `tipo`, `senha` e CPF ou matrícula; retorna token
  Bearer com validade de 8 horas.
- `GET /api/auth/sessao`: valida uma sessão autenticada.

Senhas novas são armazenadas com scrypt e salt aleatório. Senhas legadas em texto
plano são convertidas para hash no primeiro login bem-sucedido. A rota de envio da
avaliação exige o token de autenticação.