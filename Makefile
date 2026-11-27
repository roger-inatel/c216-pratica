BACKEND_DIR := backend
FRONTEND_DIR := frontend
UVICORN_HOST := 0.0.0.0
UVICORN_PORT := 8000

# Ferramentas externas, declaradas com ?= para poderem ser sobrescritas sem editar
# este arquivo. Exemplo: make install POETRY="python -m poetry"
POETRY ?= poetry
COMPOSE ?= docker compose
PYTHON ?= python
NPM ?= npm

BACKEND_SERVICE := backend
DB_SERVICE := db

# Credenciais do banco, com os mesmos padroes do docker-compose.yml. Sao variaveis
# do make, e nao expansao de shell: "${VAR:-padrao}" so existe em shells POSIX e
# chegava literal ao psql quando o make rodava pelo cmd.exe. Com ?= o ambiente
# ainda sobrescreve: POSTGRES_USER=outro make db-shell.
POSTGRES_USER ?= entregas
POSTGRES_DB ?= entregas

.PHONY: help install run test test-verbose test-unit test-integration \
        lint format format-check clean \
        docker-build docker-up docker-down docker-logs docker-ps \
        docker-shell docker-rebuild up-build ps down \
        db-shell db-upgrade db-downgrade db-current db-history db-migration \
        frontend-install frontend-dev frontend-lint frontend-format frontend-check \
        frontend-test frontend-test-e2e frontend-build e2e check-all

# O texto vai para o ambiente e e impresso pelo Python. Com @echo, o cmd.exe
# imprime as aspas junto, e sem aspas o shell POSIX come a indentacao - o
# define preserva o texto exato nos dois.
define TEXTO_AJUDA
Ambiente local (Poetry):
  make help             - lista os comandos disponiveis
  make install          - instala as dependencias do backend com Poetry
  make run              - inicia o servidor FastAPI (uvicorn) em modo dev
  make lint             - verifica o codigo com o linter
  make format           - formata o codigo automaticamente
  make format-check     - confere a formatacao sem alterar arquivos (como no CI)
  make clean            - remove caches e arquivos temporarios

Testes (pytest):
  make test             - roda todos os testes
  make test-verbose     - roda todos os testes, listando cada um
  make test-unit        - roda so os testes unitarios (sem HTTP)
  make test-integration - roda so os testes de integracao (TestClient)

Containers (Docker Compose):
  make docker-build     - constroi as imagens do backend e do frontend
  make docker-up        - sobe banco, backend e frontend em segundo plano
  make docker-down      - derruba os servicos e remove a rede
  make docker-logs      - acompanha os logs do backend em tempo real
  make docker-ps        - mostra o status dos servicos
  make docker-shell     - abre um shell dentro do container do backend
  make docker-rebuild   - reconstroi as imagens do zero e sobe de novo
  make up-build         - reconstroi o que mudou e sobe, esperando ficar tudo healthy
  make ps               - o mesmo que docker-ps
  make down             - o mesmo que docker-down

Banco de dados (Alembic, com os containers no ar):
  make db-shell         - abre o psql no banco de dados
  make db-upgrade       - aplica as migrations pendentes
  make db-downgrade     - desfaz a ultima migration
  make db-current       - mostra a revisao aplicada no banco
  make db-history       - lista o historico de migrations
  make db-migration MSG="descricao" - gera uma migration a partir dos modelos

Frontend (npm, a partir da raiz):
  make frontend-install  - instala as dependencias do frontend (npm ci)
  make frontend-dev      - inicia o frontend em modo dev (Vite, porta 5173)
  make frontend-lint     - verifica o codigo com o Biome
  make frontend-format   - formata o codigo com o Biome
  make frontend-check    - lint, formatacao e imports sem alterar arquivos
  make frontend-test     - roda os testes unitarios e de integracao (Vitest)
  make frontend-test-e2e - roda os testes E2E contra a aplicacao ja no ar (Playwright)
  make frontend-build    - gera o build de producao em frontend/dist

Tudo junto:
  make e2e              - sobe uma pilha separada, roda os testes E2E e derruba tudo
  make check-all        - roda lint, formatacao, testes, build e E2E de tudo num comando so
endef
export TEXTO_AJUDA

help:
	@$(PYTHON) -c "import os; print(os.environ['TEXTO_AJUDA'])"

install:
	cd $(BACKEND_DIR) && $(POETRY) install

run:
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn app.main:app --reload --host $(UVICORN_HOST) --port $(UVICORN_PORT)

test:
	cd $(BACKEND_DIR) && $(POETRY) run pytest

test-verbose:
	cd $(BACKEND_DIR) && $(POETRY) run pytest -v

test-unit:
	cd $(BACKEND_DIR) && $(POETRY) run pytest tests/unit

test-integration:
	cd $(BACKEND_DIR) && $(POETRY) run pytest tests/integration

lint:
	cd $(BACKEND_DIR) && $(POETRY) run ruff check .

format:
	cd $(BACKEND_DIR) && $(POETRY) run ruff format .

format-check:
	cd $(BACKEND_DIR) && $(POETRY) run ruff format --check .

# O find do Unix nao existe no Windows fora do Git Bash: no cmd.exe o nome resolve
# para o FIND.EXE do sistema, que busca texto e falha. O Python ja e pre-requisito
# do projeto e faz o mesmo em qualquer shell. O .venv fica de fora de proposito.
clean:
	@$(PYTHON) -c "import pathlib, shutil; alvos = [d for d in pathlib.Path('.').rglob('*') if d.is_dir() and d.name in ('__pycache__', '.pytest_cache', '.ruff_cache') and '.venv' not in d.parts]; [shutil.rmtree(d, ignore_errors=True) for d in alvos]; print('caches removidos:', len(alvos))"

docker-build:
	$(COMPOSE) build

docker-up:
	$(COMPOSE) up -d

docker-down:
	$(COMPOSE) down

docker-logs:
	$(COMPOSE) logs -f $(BACKEND_SERVICE)

docker-ps:
	$(COMPOSE) ps

# Sem barra inicial de proposito: no Git Bash do Windows, "/bin/bash" seria
# convertido para um caminho do host antes de chegar ao container.
docker-shell:
	$(COMPOSE) exec $(BACKEND_SERVICE) bash

docker-rebuild:
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

# Nomes usados no checklist da Pratica 7.
up-build:
	$(COMPOSE) up -d --build --wait

ps: docker-ps

down: docker-down

db-shell:
	$(COMPOSE) exec $(DB_SERVICE) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

db-upgrade:
	$(COMPOSE) exec $(BACKEND_SERVICE) alembic upgrade head

db-downgrade:
	$(COMPOSE) exec $(BACKEND_SERVICE) alembic downgrade -1

db-current:
	$(COMPOSE) exec $(BACKEND_SERVICE) alembic current

db-history:
	$(COMPOSE) exec $(BACKEND_SERVICE) alembic history

# A migration e gerada dentro do container, que ja aponta para o banco do Compose,
# e o arquivo criado volta para o repositorio. Rodar o Alembic pelo host exigiria
# que a porta publicada do Postgres estivesse livre na maquina de quem gera.
db-migration:
	@$(PYTHON) -c "import sys; sys.exit('uso: make db-migration MSG=descricao') if not '$(MSG)' else None"
	$(COMPOSE) exec $(BACKEND_SERVICE) alembic revision --autogenerate -m "$(MSG)"
	$(COMPOSE) cp $(BACKEND_SERVICE):/app/alembic/versions/. ./$(BACKEND_DIR)/alembic/versions

frontend-install:
	cd $(FRONTEND_DIR) && $(NPM) ci

frontend-dev:
	cd $(FRONTEND_DIR) && $(NPM) run dev

frontend-lint:
	cd $(FRONTEND_DIR) && $(NPM) run lint

frontend-format:
	cd $(FRONTEND_DIR) && $(NPM) run format

frontend-check:
	cd $(FRONTEND_DIR) && $(NPM) run check

frontend-test:
	cd $(FRONTEND_DIR) && $(NPM) run test

frontend-test-e2e:
	cd $(FRONTEND_DIR) && $(NPM) run test:e2e

frontend-build:
	cd $(FRONTEND_DIR) && $(NPM) run build

# O E2E sobe uma pilha propria (outro projeto, outras portas e banco zerado) e a
# derruba no final, mesmo quando o teste falha. A pilha do make docker-up fica intacta.
E2E_STACK := entregas-e2e
E2E_FRONTEND_PORT := 5174
E2E_BACKEND_PORT := 8001
E2E_POSTGRES_PORT := 55432
COMPOSE_E2E = $(COMPOSE) -p $(E2E_STACK)

e2e: export STACK_NAME := $(E2E_STACK)
e2e: export FRONTEND_PORT := $(E2E_FRONTEND_PORT)
e2e: export BACKEND_PORT := $(E2E_BACKEND_PORT)
e2e: export POSTGRES_PORT := $(E2E_POSTGRES_PORT)
e2e: export VITE_API_URL := http://localhost:$(E2E_BACKEND_PORT)
e2e: export CORS_ORIGINS := http://localhost:$(E2E_FRONTEND_PORT),http://127.0.0.1:$(E2E_FRONTEND_PORT)
e2e: export E2E_BASE_URL := http://localhost:$(E2E_FRONTEND_PORT)

# --wait so devolve o controle quando os tres containers estao healthy.
e2e:
	$(COMPOSE_E2E) up -d --build --wait || ($(COMPOSE_E2E) logs --no-color && $(COMPOSE_E2E) down -v && exit 1)
	$(MAKE) frontend-test-e2e || ($(COMPOSE_E2E) logs --no-color --tail=50 && $(COMPOSE_E2E) down -v && exit 1)
	$(COMPOSE_E2E) down -v

check-all: lint format-check test frontend-check frontend-test frontend-build e2e
