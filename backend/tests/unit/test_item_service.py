from typing import Any

import pytest

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate
from app.services.item import ItemJaExiste, ItemNaoEncontrado, ItemService


class RepositorioFalso:
    # Mesma interface do ItemRepository, sem banco: o que esta sob teste aqui e a
    # regra do service, nao o acesso aos dados.
    def __init__(self) -> None:
        self._itens: dict[int, Item] = {}
        self._proximo_id = 1

    def listar(self, limit: int) -> list[Item]:
        return list(self._itens.values())[:limit]

    def buscar(self, item_id: int) -> Item | None:
        return self._itens.get(item_id)

    def buscar_por_nome(self, name: str) -> Item | None:
        return next((item for item in self._itens.values() if item.name == name), None)

    def criar(self, campos: dict[str, Any]) -> Item:
        item = Item(id=self._proximo_id, **campos)
        self._itens[item.id] = item
        self._proximo_id += 1

        return item

    def atualizar(self, item: Item, campos: dict[str, Any]) -> Item:
        for campo, valor in campos.items():
            setattr(item, campo, valor)

        return item

    def remover(self, item: Item) -> None:
        del self._itens[item.id]


@pytest.fixture
def service() -> ItemService:
    return ItemService(RepositorioFalso())


def test_criar_atribui_ids_sequenciais(service):
    primeiro = service.criar(ItemCreate(name="teclado"))
    segundo = service.criar(ItemCreate(name="monitor"))

    assert (primeiro.id, segundo.id) == (1, 2)


def test_criar_mantem_os_dados_enviados(service):
    item = service.criar(ItemCreate(name="teclado", description="mecanico"))

    assert (item.name, item.description) == ("teclado", "mecanico")


@pytest.mark.parametrize(("limit", "esperado"), [(1, 1), (2, 2), (10, 3)])
def test_listar_respeita_o_limite(service, limit, esperado):
    for nome in ("teclado", "monitor", "mouse"):
        service.criar(ItemCreate(name=nome))

    assert len(service.listar(limit)) == esperado


def test_buscar_item_inexistente_levanta_erro(service):
    with pytest.raises(ItemNaoEncontrado, match="42"):
        service.buscar(42)


def test_substituir_troca_todos_os_campos(service):
    item = service.criar(ItemCreate(name="teclado", description="mecanico"))

    substituido = service.substituir(item.id, ItemCreate(name="monitor"))

    assert (substituido.id, substituido.name, substituido.description) == (item.id, "monitor", None)


def test_atualizar_mantem_os_campos_nao_enviados(service):
    item = service.criar(ItemCreate(name="teclado", description="mecanico"))

    atualizado = service.atualizar(item.id, ItemUpdate(name="monitor"))

    assert (atualizado.name, atualizado.description) == ("monitor", "mecanico")


def test_remover_tira_o_item_da_listagem(service):
    item = service.criar(ItemCreate(name="teclado"))

    service.remover(item.id)

    assert service.listar(10) == []


def test_remover_item_inexistente_levanta_erro(service):
    with pytest.raises(ItemNaoEncontrado, match="42"):
        service.remover(42)


def test_criar_com_nome_ja_usado_levanta_erro(service):
    service.criar(ItemCreate(name="teclado"))

    with pytest.raises(ItemJaExiste, match="teclado"):
        service.criar(ItemCreate(name="teclado"))


def test_atualizar_para_nome_de_outro_item_levanta_erro(service):
    service.criar(ItemCreate(name="teclado"))
    item = service.criar(ItemCreate(name="monitor"))

    with pytest.raises(ItemJaExiste, match="teclado"):
        service.atualizar(item.id, ItemUpdate(name="teclado"))


def test_substituir_mantendo_o_proprio_nome_nao_levanta_erro(service):
    item = service.criar(ItemCreate(name="teclado", description="mecanico"))

    substituido = service.substituir(item.id, ItemCreate(name="teclado"))

    assert substituido.description is None
