from app.models.item import Item
from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate, ItemUpdate


class ItemNaoEncontrado(Exception):
    def __init__(self, item_id: int) -> None:
        super().__init__(f"Item {item_id} nao encontrado")
        self.item_id = item_id


class ItemJaExiste(Exception):
    def __init__(self, name: str) -> None:
        super().__init__(f"Ja existe um item com o nome {name}")
        self.name = name


class ItemService:
    def __init__(self, repositorio: ItemRepository) -> None:
        self._repositorio = repositorio

    def listar(self, limit: int) -> list[Item]:
        return self._repositorio.listar(limit)

    def buscar(self, item_id: int) -> Item:
        item = self._repositorio.buscar(item_id)
        if item is None:
            raise ItemNaoEncontrado(item_id)

        return item

    def criar(self, dados: ItemCreate) -> Item:
        self._exigir_nome_livre(dados.name)

        return self._repositorio.criar(dados.model_dump())

    def substituir(self, item_id: int, dados: ItemCreate) -> Item:
        item = self.buscar(item_id)
        self._exigir_nome_livre(dados.name, item.id)

        return self._repositorio.atualizar(item, dados.model_dump())

    def atualizar(self, item_id: int, dados: ItemUpdate) -> Item:
        item = self.buscar(item_id)
        campos = dados.model_dump(exclude_unset=True)
        if "name" in campos:
            self._exigir_nome_livre(campos["name"], item.id)

        return self._repositorio.atualizar(item, campos)

    def remover(self, item_id: int) -> None:
        self._repositorio.remover(self.buscar(item_id))

    def _exigir_nome_livre(self, name: str, item_id: int | None = None) -> None:
        ocupado = self._repositorio.buscar_por_nome(name)
        if ocupado is not None and ocupado.id != item_id:
            raise ItemJaExiste(name)
