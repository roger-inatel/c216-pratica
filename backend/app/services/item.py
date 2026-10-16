from app.schemas.item import Item, ItemCreate, ItemUpdate


class ItemNaoEncontrado(Exception):
    def __init__(self, item_id: int) -> None:
        super().__init__(f"Item {item_id} nao encontrado")
        self.item_id = item_id


class ItemService:
    def __init__(self) -> None:
        self._itens: dict[int, Item] = {}
        self._proximo_id = 1

    def listar(self, limit: int) -> list[Item]:
        return list(self._itens.values())[:limit]

    def buscar(self, item_id: int) -> Item:
        if item_id not in self._itens:
            raise ItemNaoEncontrado(item_id)

        return self._itens[item_id]

    def criar(self, dados: ItemCreate) -> Item:
        item = Item(id=self._proximo_id, **dados.model_dump())
        self._itens[item.id] = item
        self._proximo_id += 1

        return item

    def substituir(self, item_id: int, dados: ItemCreate) -> Item:
        self.buscar(item_id)
        item = Item(id=item_id, **dados.model_dump())
        self._itens[item_id] = item

        return item

    def atualizar(self, item_id: int, dados: ItemUpdate) -> Item:
        atual = self.buscar(item_id)
        item = atual.model_copy(update=dados.model_dump(exclude_unset=True))
        self._itens[item_id] = item

        return item

    def remover(self, item_id: int) -> None:
        self.buscar(item_id)
        del self._itens[item_id]

    def limpar(self) -> None:
        self._itens.clear()
        self._proximo_id = 1


item_service = ItemService()
