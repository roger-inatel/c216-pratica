import pytest

from app.schemas.item import ItemCreate, ItemUpdate
from app.services.item import ItemNaoEncontrado, item_service


def test_criar_atribui_ids_sequenciais():
    primeiro = item_service.criar(ItemCreate(name="teclado"))
    segundo = item_service.criar(ItemCreate(name="monitor"))

    assert (primeiro.id, segundo.id) == (1, 2)


def test_criar_mantem_os_dados_enviados():
    item = item_service.criar(ItemCreate(name="teclado", description="mecanico"))

    assert (item.name, item.description) == ("teclado", "mecanico")


@pytest.mark.parametrize(("limit", "esperado"), [(1, 1), (2, 2), (10, 3)])
def test_listar_respeita_o_limite(limit, esperado):
    for nome in ("teclado", "monitor", "mouse"):
        item_service.criar(ItemCreate(name=nome))

    assert len(item_service.listar(limit)) == esperado


def test_buscar_item_inexistente_levanta_erro():
    with pytest.raises(ItemNaoEncontrado, match="42"):
        item_service.buscar(42)


def test_substituir_troca_todos_os_campos():
    item = item_service.criar(ItemCreate(name="teclado", description="mecanico"))

    substituido = item_service.substituir(item.id, ItemCreate(name="monitor"))

    assert (substituido.id, substituido.name, substituido.description) == (item.id, "monitor", None)


def test_atualizar_mantem_os_campos_nao_enviados():
    item = item_service.criar(ItemCreate(name="teclado", description="mecanico"))

    atualizado = item_service.atualizar(item.id, ItemUpdate(name="monitor"))

    assert (atualizado.name, atualizado.description) == ("monitor", "mecanico")


def test_remover_tira_o_item_da_listagem():
    item = item_service.criar(ItemCreate(name="teclado"))

    item_service.remover(item.id)

    assert item_service.listar(10) == []


def test_remover_item_inexistente_levanta_erro():
    with pytest.raises(ItemNaoEncontrado, match="42"):
        item_service.remover(42)
