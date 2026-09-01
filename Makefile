BACKEND_DIR := backend
POETRY := poetry
UVICORN_HOST := 0.0.0.0
UVICORN_PORT := 8000

.PHONY: help install run test lint format clean

help:
	@echo "Comandos disponiveis:"
	@echo "  make install  - instala as dependencias do backend com Poetry"
	@echo "  make run      - inicia o servidor FastAPI (uvicorn) em modo dev"
	@echo "  make test     - roda a suite de testes com pytest"
	@echo "  make lint     - verifica o codigo com o linter"
	@echo "  make format   - formata o codigo automaticamente"
	@echo "  make clean    - remove caches e arquivos temporarios"

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

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
