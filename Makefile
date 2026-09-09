BACKEND_DIR := backend
UVICORN_HOST := 0.0.0.0
UVICORN_PORT := 8000

# Ferramentas externas, declaradas com ?= para poderem ser sobrescritas sem editar
# este arquivo. Exemplo: make install POETRY="python -m poetry"
POETRY ?= poetry
COMPOSE ?= docker compose
PYTHON ?= python

BACKEND_SERVICE := backend
DB_SERVICE := db

# Credenciais do banco, com os mesmos padroes do docker-compose.yml. Sao variaveis
# do make, e nao expansao de shell: "${VAR:-padrao}" so existe em shells POSIX e
# chegava literal ao psql quando o make rodava pelo cmd.exe. Com ?= o ambiente
# ainda sobrescreve: POSTGRES_USER=outro make db-shell.
POSTGRES_USER ?= c216
POSTGRES_DB ?= c216

.PHONY: help install run test lint format clean \
        docker-build docker-up docker-down docker-logs docker-ps \
        docker-shell docker-rebuild db-shell

# O texto vai para o ambiente e e impresso pelo Python. Com @echo, o cmd.exe
# imprime as aspas junto, e sem aspas o shell POSIX come a indentacao - o
# define preserva o texto exato nos dois.
define TEXTO_AJUDA
Ambiente local (Poetry):
  make help           - lista os comandos disponiveis
  make install        - instala as dependencias do backend com Poetry
  make run            - inicia o servidor FastAPI (uvicorn) em modo dev
  make test           - roda a suite de testes com pytest
  make lint           - verifica o codigo com o linter
  make format         - formata o codigo automaticamente
  make clean          - remove caches e arquivos temporarios

Containers (Docker Compose):
  make docker-build   - constroi a imagem do backend
  make docker-up      - sobe backend e banco em segundo plano
  make docker-down    - derruba os servicos e remove a rede
  make docker-logs    - acompanha os logs do backend em tempo real
  make docker-ps      - mostra o status dos servicos
  make docker-shell   - abre um shell dentro do container do backend
  make docker-rebuild - reconstroi as imagens do zero e sobe de novo
  make db-shell       - abre o psql no banco de dados
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

lint:
	cd $(BACKEND_DIR) && $(POETRY) run ruff check .

format:
	cd $(BACKEND_DIR) && $(POETRY) run ruff format .

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

db-shell:
	$(COMPOSE) exec $(DB_SERVICE) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)
