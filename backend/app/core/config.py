import os

# O Compose define esta variavel apontando para o servico "db". O padrao abaixo atende
# quem roda o Alembic fora do container, contra a porta que o banco publica no host.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://entregas:entregas@localhost:5432/entregas"
)


def ler_origens(texto: str) -> list[str]:
    return [origem.strip() for origem in texto.split(",") if origem.strip()]


# Origens que o navegador pode usar para chamar a API, separadas por virgula.
# Lista explicita: "*" liberaria qualquer site.
CORS_ORIGINS = ler_origens(os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"))
