import pytest
from fastapi import status

from app.models.item import Item


def criar_item(client, **dados):
    resposta = client.post("/items", json={"name": "teclado", **dados})

    return resposta.json()


def test_post_cria_o_item_e_retorna_201(client):
    resposta = client.post("/items", json={"name": "teclado", "description": "mecanico"})

    assert resposta.status_code == status.HTTP_201_CREATED
    assert resposta.json() == {"id": 1, "name": "teclado", "description": "mecanico"}


def test_post_com_payload_invalido_retorna_422(client):
    resposta = client.post("/items", json={"description": "sem nome"})

    assert resposta.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_get_lista_os_itens_criados(client):
    criar_item(client, name="teclado")
    criar_item(client, name="monitor")

    resposta = client.get("/items")

    assert resposta.status_code == status.HTTP_200_OK
    assert [item["name"] for item in resposta.json()] == ["teclado", "monitor"]


@pytest.mark.parametrize(("limit", "esperado"), [(1, 1), (2, 2)])
def test_get_aceita_o_query_parameter_limit(client, limit, esperado):
    for nome in ("teclado", "monitor", "mouse"):
        criar_item(client, name=nome)

    resposta = client.get("/items", params={"limit": limit})

    assert len(resposta.json()) == esperado


def test_get_com_limit_invalido_retorna_422(client):
    resposta = client.get("/items", params={"limit": 0})

    assert resposta.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_get_por_id_retorna_o_item(client):
    item = criar_item(client, name="teclado")

    resposta = client.get(f"/items/{item['id']}")

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.json() == item


def test_put_substitui_todos_os_campos(client):
    item = criar_item(client, name="teclado", description="mecanico")

    resposta = client.put(f"/items/{item['id']}", json={"name": "monitor"})

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.json() == {"id": item["id"], "name": "monitor", "description": None}


def test_patch_atualiza_apenas_o_campo_enviado(client):
    item = criar_item(client, name="teclado", description="mecanico")

    resposta = client.patch(f"/items/{item['id']}", json={"name": "monitor"})

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.json() == {"id": item["id"], "name": "monitor", "description": "mecanico"}


def test_delete_remove_o_item_e_retorna_204(client):
    item = criar_item(client, name="teclado")

    resposta = client.delete(f"/items/{item['id']}")

    assert resposta.status_code == status.HTTP_204_NO_CONTENT
    assert client.get("/items").json() == []


@pytest.mark.parametrize(
    ("metodo", "corpo"),
    [
        ("GET", None),
        ("PUT", {"name": "teclado"}),
        ("PATCH", {"name": "teclado"}),
        ("DELETE", None),
    ],
)
def test_item_inexistente_retorna_404(client, metodo, corpo):
    resposta = client.request(metodo, "/items/42", json=corpo)

    assert resposta.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in resposta.json()


def test_post_com_nome_ja_usado_retorna_409(client):
    criar_item(client, name="teclado")

    resposta = client.post("/items", json={"name": "teclado"})

    assert resposta.status_code == status.HTTP_409_CONFLICT
    assert "detail" in resposta.json()


def test_patch_para_nome_de_outro_item_retorna_409(client):
    criar_item(client, name="teclado")
    item = criar_item(client, name="monitor")

    resposta = client.patch(f"/items/{item['id']}", json={"name": "teclado"})

    assert resposta.status_code == status.HTTP_409_CONFLICT


def test_patch_com_nome_nulo_retorna_422(client):
    item = criar_item(client, name="teclado")

    resposta = client.patch(f"/items/{item['id']}", json={"name": None})

    assert resposta.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_item_criado_fica_gravado_no_banco(client, sessao):
    criado = criar_item(client, name="teclado", description="mecanico")

    gravado = sessao.get(Item, criado["id"])

    assert (gravado.name, gravado.description) == ("teclado", "mecanico")


def test_item_removido_sai_do_banco(client, sessao):
    item = criar_item(client, name="teclado")

    client.delete(f"/items/{item['id']}")

    assert sessao.get(Item, item["id"]) is None
