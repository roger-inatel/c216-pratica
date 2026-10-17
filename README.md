# C216 - Sistemas Distribuidos

Repositorio das praticas da disciplina C216 - Sistemas Distribuidos (Inatel).

## Estrutura

- `backend/` - API em FastAPI, gerenciada pelo Poetry
- `docker-compose.yml` - sobe a API junto com o banco de dados
- `Makefile` - centraliza os comandos do projeto
- `.env.example` - modelo das variaveis de ambiente; o compose tem padrao para todas, entao o projeto sobe sem `.env`
- `.github/workflows/ci-backend.yml` - CI do backend (testes e lint)

## Pre-requisitos

- `make` - executa os comandos deste repositorio
- `poetry` - gerencia as dependencias do backend
- `python` 3.11 ou superior - exigido pelo `pyproject.toml` e usado por `make help` e `make clean`
- `docker` com o plugin `compose` - apenas para os comandos de container

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
make docker-up   # sobe a API e o banco em containers
```

Detalhes do backend em [backend/README.md](backend/README.md).

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
O merge em `aulas` e `main` exige os dois passando e uma aprovacao.

Para rodar localmente o mesmo que o CI:

```bash
make format-check
make lint
make test-verbose
```

## Branches

- `main` - branch principal do repositorio
- `aulas` - acumula as entregas das praticas realizadas em aula
- `projeto-final` - desenvolvimento do projeto final da disciplina

## Autor

Roger Pereira Freitas
