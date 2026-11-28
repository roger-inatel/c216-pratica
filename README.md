# Controle de Entregas

Projeto final da disciplina C216 - Sistemas Distribuídos (Inatel).

## Vídeo de demonstração

O vídeo de apresentação demonstra o funcionamento do sistema, incluindo o cadastro e gerenciamento de clientes, o registro de pedidos, as alterações de status, os filtros e o resumo de pedidos.

Link do vídeo: https://youtu.be/jbBEkceQino

## Objetivo e tema

O objetivo deste projeto é desenvolver um sistema para controlar pedidos e entregas de uma distribuidora. O sistema permite cadastrar clientes, registrar pedidos, acompanhar seus status e controlar as entregas. Também apresenta um resumo com a quantidade de pedidos em cada status e o valor total dos pedidos entregues.

A aplicação foi desenvolvida utilizando FastAPI no backend, React no frontend e PostgreSQL para armazenar os dados. Todo o sistema é executado localmente utilizando Docker Compose.

## Funcionalidades

### Clientes

- Cadastrar clientes com nome, endereço e telefone opcional.
- Listar clientes em ordem alfabética.
- Buscar clientes por parte do nome.
- Editar os dados de um cliente.
- Impedir o cadastro de dois clientes com o mesmo telefone.
- Impedir a exclusão de clientes que possuem pedidos.

### Pedidos

- Registrar pedidos vinculados a um cliente, com descrição e valor.
- Aceitar valores no formato brasileiro, como `49,90` e `1.250,00`.
- Criar todos os pedidos com o status inicial `aberto`.
- Alterar o status dos pedidos seguindo as regras de negócio.
- Permitir o cancelamento de pedidos que ainda não foram entregues.
- Editar pedidos somente enquanto estiverem abertos.
- Excluir pedidos somente quando estiverem abertos ou cancelados.
- Filtrar a lista de pedidos por status.

### Resumo

- Mostrar a quantidade de pedidos em cada status.
- Mostrar o valor total dos pedidos entregues.

### Interface

- Exibir mensagens de sucesso e de erro em cada operação.
- Mostrar "Carregando..." enquanto os dados são buscados e um botão "Tentar novamente" quando a API estiver indisponível.
- Manter os dados digitados no formulário quando ocorrer um erro.

## Regras de negócio

A principal regra de negócio do sistema está relacionada ao fluxo de status dos pedidos.

Todo pedido é criado com o status `aberto` e pode seguir o seguinte fluxo:

```text
aberto → em_rota → entregue
   ↓         ↓
cancelado  cancelado
```

Também é possível cancelar um pedido enquanto ele ainda não foi entregue.

Os status `entregue` e `cancelado` são finais. Isso significa que, depois de atingir um desses status, o pedido não pode ter seu status alterado novamente.

Outras regras importantes:

- Pedidos só podem ser editados enquanto estiverem abertos.
- Pedidos só podem ser excluídos quando estiverem abertos ou cancelados.
- Clientes que possuem pedidos não podem ser excluídos.
- Dois clientes não podem ter o mesmo telefone.

Essas regras são verificadas pela aplicação. A restrição de exclusão de clientes que possuem pedidos também é garantida pelo banco de dados.

---

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Alembic, Poetry, Ruff, Pytest |
| Banco | PostgreSQL 16 |
| Frontend | React 19 (JavaScript), Vite, Tailwind CSS 4, Biome, Vitest, Testing Library, Playwright |
| Infra | Docker, Docker Compose, nginx (serve o frontend), Makefile, GitHub Actions |

## Estrutura do projeto

```text
backend/
  app/api/routes/      rotas HTTP (clientes, pedidos, sistema)
  app/services/        regras de negócio
  app/repositories/    acesso ao banco
  app/schemas/         validação de entrada e formato de saída (Pydantic)
  app/models/          tabelas (SQLAlchemy)
  app/database/        conexão e sessão do banco
  app/core/            configuração e erros de negócio
  alembic/             migrations
  tests/               unit/ e integration/
frontend/
  src/services/        chamadas à API com fetch
  src/components/      telas de pedidos e de clientes
  src/validation.js    validação dos formulários
  src/status.js        status do pedido e ações permitidas em cada um
  tests/               unit/, integration/ e e2e/
docker-compose.yml     serviços db, backend e frontend
Makefile               comandos do projeto
.env.example           variáveis de ambiente
```

## Pré-requisitos

- Docker com Docker Compose
- make
- Para rodar os testes fora do Docker: Python 3.11+ com Poetry e Node.js 22+ com npm
- Para os testes E2E (uma vez por máquina): `cd frontend && npx playwright install chromium`

## Variáveis de ambiente

```bash
cp .env.example .env
```

O `.env` é opcional: o `docker-compose.yml` tem valor padrão para todas as variáveis. O `.env` não vai para o Git.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `entregas` | acesso ao banco |
| `POSTGRES_PORT` | `5432` | porta do banco no host |
| `BACKEND_PORT` | `8000` | porta da API |
| `FRONTEND_PORT` | `5173` | porta da interface |
| `VITE_API_URL` | `http://localhost:8000` | endereço da API chamado pelo navegador; entra no build, então depois de mudar rode `make up-build` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | origens aceitas pela API, separadas por vírgula |

## Como executar

```bash
make up-build     # constrói as imagens e sobe db, backend e frontend
make ps           # status dos containers
make docker-logs  # logs do backend
make down         # derruba os containers (os dados continuam no volume)
make help         # lista todos os comandos
```

O backend só sobe depois que o banco está saudável e roda `alembic upgrade head` antes de iniciar. Para apagar os dados e começar do zero: `docker compose down -v`.

## Como acessar

- Interface: http://localhost:5173
- API: http://localhost:8000
- Documentação da API (Swagger): http://localhost:8000/docs

## Migrações

As migrations rodam sozinhas quando o backend sobe. Com os containers no ar:

```bash
make db-current                     # revisão aplicada (deve mostrar "(head)")
make db-history                     # histórico de migrations
make db-upgrade                     # aplica as pendentes
make db-downgrade                   # volta uma revisão
make db-migration MSG="descricao"   # gera uma nova a partir dos models
```

Migration atual: `bd1b74ee62be` (cria as tabelas `clientes` e `pedidos`).

## Testes

```bash
make install           # dependências do backend (uma vez)
make test              # 59 testes do backend com Pytest
make lint              # Ruff
make frontend-install  # dependências do frontend (uma vez)
make frontend-test     # 61 testes do frontend com Vitest
make frontend-check    # Biome
make e2e               # 4 testes Playwright contra a aplicação completa
make check-all         # tudo acima em sequência
```

O `make e2e` sobe uma pilha separada (portas 5174, 8001 e 55432), roda os testes e derruba tudo no final, sem mexer nos dados da aplicação principal.

CI no GitHub Actions, em todo push e pull request:

- `.github/workflows/ci-backend.yml`: Ruff e Pytest contra PostgreSQL
- `.github/workflows/ci-frontend.yml`: Biome, Vitest, build e `make e2e`

## Autor

Roger Pereira Freitas
