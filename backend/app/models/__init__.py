# O Alembic descobre as tabelas por Base.metadata, que so conhece os modelos
# importados em algum lugar: sem esta linha o autogenerate sai vazio.
from app.models.item import Item

__all__ = ["Item"]
