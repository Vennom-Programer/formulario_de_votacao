## Autenticação

O backend usa as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
`DB_NAME` e `AUTH_SECRET` definidas em `back-end/.env` ou no ambiente de execução.
O `AUTH_SECRET` precisa ter pelo menos 32 bytes. O arquivo `.env` é carregado pelo
caminho do backend, independentemente do diretório de onde o servidor for iniciado.
Na Vercel, configure `AUTH_SECRET` em **Settings → Environment Variables** para
cada ambiente de deployment e publique um novo deployment. Gere um segredo local
com `openssl rand -hex 32`; não reutilize nem publique o valor do `.env`.

A tabela `usuario` deve estar previamente configurada com `id_usuario`, `nome`,
`email`, `senha`, `cpf` (`VARCHAR(11)`) e `matricula` (aceitando `NULL` para
visitantes). O backend não cria nem altera tabelas.

Rotas:

- `POST /api/auth/cadastro`: recebe `tipo` (`visitante` ou `aluno`), `nome`,
  `email`, `senha`, `confirmarSenha` e CPF ou matrícula.
- `POST /api/auth/login`: recebe `tipo`, `senha` e CPF ou matrícula; retorna token
  Bearer com validade de 8 horas.
- `GET /api/auth/sessao`: valida uma sessão autenticada.

Senhas novas são armazenadas com scrypt e salt aleatório. Senhas legadas em texto
plano são convertidas para hash no primeiro login bem-sucedido. Após o login, o
frontend guarda o token na sessão atual e libera a página de votação. A rota de
envio da avaliação exige o token de autenticação e usa o CPF do visitante ou a
matrícula do aluno da sessão diretamente como `id_avaliador`; não é necessário
enviar um código separado. Ao cadastrar a conta, o backend também cria ou ativa
o registro correspondente em `avaliadores`; contas existentes são vinculadas no
próximo login. A coluna `id_avaliador` e as
referências correspondentes em `avaliacoes` devem aceitar o CPF ou a matrícula
como identificador. O valor permanece sem formatação.