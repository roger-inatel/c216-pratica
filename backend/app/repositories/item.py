from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.item import Item


class ItemRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def listar(self, limit: int) -> list[Item]:
        return list(self._db.scalars(select(Item).order_by(Item.id).limit(limit)))

    def buscar(self, item_id: int) -> Item | None:
        return self._db.get(Item, item_id)

    def buscar_por_nome(self, name: str) -> Item | None:
        return self._db.scalars(select(Item).where(Item.name == name)).first()

    def criar(self, campos: dict[str, Any]) -> Item:
        item = Item(**campos)
        self._db.add(item)
        self._db.commit()
        self._db.refresh(item)

        return item

    def atualizar(self, item: Item, campos: dict[str, Any]) -> Item:
        for campo, valor in campos.items():
            setattr(item, campo, valor)

        self._db.commit()
        self._db.refresh(item)

        return item

    def remover(self, item: Item) -> None:
        self._db.delete(item)
        self._db.commit()
