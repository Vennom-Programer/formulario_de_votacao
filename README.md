# Voto Aberto

Sistema web para avaliação e classificação de projetos acadêmicos apresentados na **UNINASSAU ADS**.

O Voto Aberto foi desenvolvido para permitir que participantes de um evento acadêmico avaliem projetos apresentados, utilizando critérios padronizados de avaliação e um sistema de votação integrado a um banco de dados PostgreSQL.

O sistema permite registrar avaliações individuais, controlar a participação dos avaliadores e calcular o ranking geral dos projetos.

## Objetivo

Desenvolver uma aplicação web capaz de organizar e automatizar o processo de avaliação de projetos acadêmicos, proporcionando maior organização, consistência e agilidade na coleta e classificação dos resultados.

## Funcionalidades

- Cadastro e autenticação de avaliadores.
- Identificação de participantes por CPF ou matrícula.
- Listagem de projetos disponíveis para avaliação.
- Avaliação de projetos por seis critérios.
- Notas de 0 a 10 para cada critério.
- Registro das avaliações no PostgreSQL.
- Restrição de uma avaliação por avaliador para cada projeto.
- Bloqueio de alterações após o envio da avaliação.
- Ranking geral dos projetos com médias ponderadas igualmente.
- Identificação do projeto com maior média geral.

## Tecnologias utilizadas

### Front-end

- React 19
- Vite 8
- JavaScript
- CSS

### Back-end

- Node.js
- Express 5
- PostgreSQL
- node-postgres (`pg`)
- CORS
- Dotenv

### Infraestrutura

- Vercel — implantação da aplicação.
- Aiven — hospedagem do banco PostgreSQL.

## Arquitetura

O projeto possui uma arquitetura separada em duas aplicações:


VOTO-ABERTO/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── back-end/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── routes/
    │   └── server.js
    ├── package.json
    └── README.md

O front-end é responsável pela interface e interação com os avaliadores.

O back-end disponibiliza as rotas da API, valida as informações recebidas, gerencia a autenticação e realiza as operações no banco de dados.

O PostgreSQL armazena os dados dos projetos, avaliadores, critérios, avaliações e notas.

## Modelo de dados

O modelo lógico principal é composto por cinco entidades:

| Entidade | Responsabilidade |
|---|---|
| PROJETOS | Armazenar os projetos acadêmicos e seus integrantes |
| AVALIADORES | Registrar e identificar os participantes |
| CRITERIOS | Definir os critérios utilizados nas avaliações |
| AVALIACOES | Registrar cada avaliação realizada |
| NOTAS | Armazenar as notas atribuídas a cada critério |

O sistema também utiliza estruturas auxiliares para cadastro de usuários e gerenciamento de sessões.

## Regras de negócio

- Cada avaliação deve conter exatamente seis notas.
- As notas devem respeitar o intervalo de 0 a 10.
- Cada avaliador pode avaliar cada projeto uma única vez.
- Uma avaliação enviada não pode ser editada.
- Cada nota deve estar associada a um critério válido.

## Autenticação e segurança

O sistema possui autenticação para visitantes e alunos.

- Visitantes utilizam CPF como identificador.
- Alunos utilizam matrícula como identificador.
- Senhas são armazenadas utilizando hash com scrypt e salt aleatório.
- As sessões utilizam tokens Bearer com validade de oito horas.
- As sessões são registradas e verificadas no PostgreSQL.
- A rota de envio de avaliações exige autenticação.

As variáveis de ambiente e credenciais não devem ser versionadas no Git.

## Instalação e execução local

### Pré-requisitos

- Node.js
- npm
- PostgreSQL

### 1. Clonar o repositório

```bash
git clone https://github.com/Vennom-Programer/formulario_de_votacao.git

cd formulario_de_votacao
```

### 2. Configurar o back-end

```bash
cd back-end
npm install
```

Crie o arquivo `.env` dentro da pasta `back-end`:

```env
DB_HOST=seu_host
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco
AUTH_SECRET=seu_segredo
```

Gere um segredo seguro com:

```bash
openssl rand -hex 32
```

O banco de dados e suas tabelas devem estar previamente configurados.

Inicie o servidor:

```bash
npm run dev
```

### 3. Configurar o front-end

Em outro terminal:

```bash
cd frontend
npm install
```

Crie o arquivo `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

Inicie a aplicação:

```bash
npm run dev
```

O Vite exibirá o endereço local para acessar a aplicação.

## API

Principais rotas disponíveis:

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/cadastro` | Cadastro de usuário |
| POST | `/api/auth/login` | Autenticação |
| GET | `/api/auth/sessao` | Validação da sessão |
| GET | `/api/projetos` | Listagem de projetos |
| GET | `/api/avaliacoes/criterios` | Listagem dos critérios |
| POST | `/api/avaliacoes` | Registro de avaliação |
| GET | `/api/status` | Verificação da aplicação e banco |

## Implantação

O projeto foi implantado em ambiente de produção utilizando Vercel e Aiven PostgreSQL.

As configurações de ambiente devem ser definidas diretamente nos respectivos serviços, sem exposição de credenciais no repositório.

## Resultados

O Voto Aberto foi desenvolvido e entregue dentro do prazo estabelecido para a apresentação dos projetos acadêmicos da UNINASSAU ADS.

A aplicação foi concluída com o fluxo de votação, recebendo elogios durante sua apresentação.

## Autor

**Desenvolvedor principal:** Kauã Vaz

GitHub: [@Vennom-Programer](https://github.com/Vennom-Programer)

Repositório: [formulario_de_votacao](https://github.com/Vennom-Programer/formulario_de_votacao)

---

Desenvolvido como projeto acadêmico para a UNINASSAU ADS.