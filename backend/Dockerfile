# ---------- Estagio 1: builder ----------
# Instala as dependencias num ambiente separado, que nao vai para a imagem final.
FROM python:3.11-slim AS builder

ENV POETRY_VERSION=2.1.4 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    PIP_NO_CACHE_DIR=1

RUN pip install "poetry==${POETRY_VERSION}"

WORKDIR /app

# Copiado antes do codigo para aproveitar o cache de camadas do Docker:
# enquanto as dependencias nao mudarem, esta etapa nao e refeita.
COPY pyproject.toml poetry.lock ./

RUN poetry install --only main

# ---------- Estagio 2: runtime ----------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Usuario criado antes das copias para que o proprio COPY ja grave o dono correto.
# Um "chown -R" depois das copias reescreveria os metadados de cada arquivo e
# gravaria o virtualenv inteiro numa segunda camada, dobrando o peso dele na imagem.
RUN useradd --create-home --uid 1000 appuser && chown appuser:appuser /app

# Traz apenas o virtualenv pronto. O Poetry e o cache de build ficam para tras.
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

COPY --chown=appuser:appuser app ./app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
