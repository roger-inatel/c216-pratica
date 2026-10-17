import os

# O Compose define esta variavel apontando para o servico "db". O padrao abaixo atende
# quem roda o Alembic fora do container, contra a porta que o banco publica no host.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://c216:c216@localhost:5432/c216")
