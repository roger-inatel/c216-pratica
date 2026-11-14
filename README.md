# C216 - Sistemas Distribuidos

Repositorio das praticas da disciplina C216 - Sistemas Distribuidos (Inatel).

## Estrutura

- `backend/` - API em FastAPI, gerenciada pelo Poetry
- `frontend/` - interface em React com Vite e Tailwind, gerenciada pelo npm
- `docker-compose.yml` - sobe o banco, a API e o frontend
- `Makefile` - centraliza os comandos do projeto
- `.env.example` - modelo das variaveis de ambiente; o compose tem padrao para todas, entao o projeto sobe sem `.env`
- `.github/workflows/ci-backend.yml` - CI do backend (testes e lint)
- `.github/workflows/ci-frontend.yml` - CI do frontend (Biome, Vitest, build e Playwright)

## Pre-requisitos

- `make` - executa os comandos deste repositorio
- `poetry` - gerencia as dependencias do backend
- `python` 3.11 ou superior - exigido pelo `pyproject.toml` e usado por `make help` e `make clean`
- `docker` com o plugin `compose` - apenas para os comandos de container
- `node` 22 ou superior, com `npm` - apenas para os comandos do frontend

Se alguma ferramenta estiver instalada com outro nome, sobrescreva a variavel em vez de
editar o Makefile:

```bash
make install POETRY="python -m poetry"
make clean PYTHON=python3
```

## Execucao

```bash
make help        # lista todos os comandos disponiveis
make install     # instala as dependencias do backend
make docker-up   # sobe banco, API e frontend em containers
make up-build    # reconstroi o que mudou, sobe e espera tudo ficar healthy
make ps          # status dos tres servicos
make down        # derruba os tres servicos
```

Com os containers no ar:

- interface: `http://localhost:5173`
- API: `http://localhost:8000` (documentacao em `/docs`)

Os servicos sobem em ordem: o backend espera o banco ficar healthy, e o frontend espera o
backend. Detalhes do backend em [backend/README.md](backend/README.md).

## Frontend

O frontend consome a API: listar, cadastrar, editar e excluir passam pelo backend e ficam
gravados no PostgreSQL. No container, o build do Vite e servido pelo nginx na porta 5173.

Duas variaveis ligam os dois lados (valores padrao no `.env.example`):

- `VITE_API_URL` - endereco da API que o navegador chama. Entra no build da imagem, entao
  depois de mudar e preciso `make docker-rebuild`;
- `CORS_ORIGINS` - origens que o backend aceita, separadas por virgula. E uma lista explicita,
  sem `*`; se mudar `FRONTEND_PORT`, ajuste aqui tambem.

Para desenvolver sem container, com o backend no ar:

```bash
make frontend-install
make frontend-dev       # http://localhost:5173
```

Comandos, estrutura, tratamento de erros e testes em [frontend/README.md](frontend/README.md).

## API

Os endpoints ficam em `backend/app/api/routes`, separados por recurso: `system.py` responde
`/` e `/health`, e `items.py` expoe o CRUD de itens em `/items`. A lista completa esta no
[README do backend](backend/README.md#rotas) e a documentacao interativa sobe junto com a
aplicacao em `http://localhost:8000/docs`.

## Banco de dados

O PostgreSQL sobe junto com a API pelo `docker-compose.yml`. A aplicacao recebe o endereco do
banco na variavel `DATABASE_URL`, que o compose monta a partir das variaveis `POSTGRES_*`.

As migrations ficam em `backend/alembic/versions` e sao aplicadas pelo proprio container antes de
o servidor iniciar, entao `make docker-up` entrega a API com o banco no formato que ela espera.

```bash
make db-current      # revisao aplicada no banco
make db-history      # historico de migrations
make db-upgrade      # aplica as migrations pendentes
make db-downgrade    # desfaz a ultima migration
make db-shell        # abre o psql
make db-migration MSG="cria tabela items"   # gera uma migration a partir dos modelos
```

A migration e gerada dentro do container, que ja aponta para o banco do compose, e o arquivo
criado volta para o repositorio.

## Testes

```bash
make test               # todos os testes
make test-verbose       # lista cada teste
make test-unit          # so os unitarios
make test-integration   # so os de integracao
```

Sem o Makefile, dentro de `backend/`: `poetry run pytest`.

Por padrao a suite usa um SQLite em memoria, entao `make test` roda sem Docker e sem banco
instalado. Com a variavel `TEST_DATABASE_URL` apontando para um PostgreSQL, os mesmos testes
rodam contra o banco de verdade - e e assim que eles rodam no CI.

Os testes rodam localmente e no CI. Eles nao rodam dentro do container, porque a imagem
Docker so instala as dependencias de producao. A organizacao dos testes esta no
[README do backend](backend/README.md#testes).

## Integracao continua

O `.github/workflows/ci-backend.yml` roda em todo push e pull request, com dois jobs:
`Pytest`, que sobe um PostgreSQL e executa a suite contra ele, e `Ruff (Lint & Format)`.

O `.github/workflows/ci-frontend.yml` tambem roda em todo push e pull request, com o job
`Frontend (Biome, Vitest, Build & Playwright)`: confere lint e formatacao, roda o Vitest e
gera o build. Depois roda `make e2e`, que sobe a aplicacao inteira com `docker compose` e
executa os testes E2E no Chromium contra ela. Se algum passo falhar, os logs dos containers
aparecem no job e o relatorio do Playwright fica disponivel como artefato da execucao.

O merge em `aulas` e `main` exige os tres jobs passando e uma aprovacao.

Para rodar localmente tudo o que os dois CIs rodam, num comando so:

```bash
make check-all
```

Ele roda Ruff e Pytest no backend, Biome, Vitest e build no frontend, e termina com o
`make e2e`.

O `make e2e` nao usa os containers do `make docker-up`. Ele sobe uma pilha separada, o projeto
`c216-e2e`, nas portas 5174 (frontend), 8001 (API) e 55432 (banco), com banco zerado. Roda o
Playwright contra ela e derruba tudo no final, volume incluido, mesmo quando um teste falha.
Assim os testes nao mexem nos dados de quem esta usando a aplicacao, e nao sobra container
`c216-e2e` depois.

## Branches

- `main` - branch principal do repositorio
- `aulas` - acumula as entregas das praticas realizadas em aula
- `projeto-final` - desenvolvimento do projeto final da disciplina

## Autor

Roger Pereira Freitas
