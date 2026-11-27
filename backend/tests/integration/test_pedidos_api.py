import pytest
from fastapi import status


@pytest.fixture
def cliente(client):
    resposta = client.post("/clientes", json={"nome": "Mercado Central", "endereco": "Rua A, 10"})
    return resposta.json()


def criar_pedido(client, cliente_id, descricao="10 caixas de leite", valor=120.5):
    resposta = client.post(
        "/pedidos", json={"cliente_id": cliente_id, "descricao": descricao, "valor": valor}
    )
    assert resposta.status_code == status.HTTP_201_CREATED, resposta.json()
    return resposta.json()


def mudar_status(client, pedido_id, novo):
    return client.patch(f"/pedidos/{pedido_id}/status", json={"status": novo})


def test_cria_pedido_aberto_com_nome_do_cliente(client, cliente):
    pedido = criar_pedido(client, cliente["id"])

    assert pedido["status"] == "aberto"
    assert pedido["cliente_nome"] == "Mercado Central"
    assert pedido["valor"] == 120.5


def test_pedido_para_cliente_inexistente_responde_404(client):
    resposta = client.post("/pedidos", json={"cliente_id": 999, "descricao": "x", "valor": 1})

    assert resposta.status_code == status.HTTP_404_NOT_FOUND
    assert resposta.json()["detail"] == "Cliente não encontrado."


@pytest.mark.parametrize(
    "payload",
    [
        {"descricao": "", "valor": 10},
        {"descricao": "Caixas", "valor": 0},
        {"descricao": "Caixas", "valor": -5},
        {"descricao": "Caixas", "valor": 10.123},
        {"descricao": "Caixas"},
    ],
)
def test_dados_invalidos_respondem_422(client, cliente, payload):
    resposta = client.post("/pedidos", json={"cliente_id": cliente["id"], **payload})

    assert resposta.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_lista_do_mais_novo_para_o_mais_antigo_e_filtra(client, cliente):
    primeiro = criar_pedido(client, cliente["id"], descricao="Primeiro")
    segundo = criar_pedido(client, cliente["id"], descricao="Segundo")
    mudar_status(client, primeiro["id"], "em_rota")

    todos = client.get("/pedidos").json()
    em_rota = client.get("/pedidos", params={"status": "em_rota"}).json()
    do_cliente = client.get("/pedidos", params={"cliente_id": cliente["id"]}).json()

    assert [p["id"] for p in todos] == [segundo["id"], primeiro["id"]]
    assert [p["id"] for p in em_rota] == [primeiro["id"]]
    assert len(do_cliente) == 2


def test_filtro_com_status_inexistente_responde_422(client):
    assert client.get("/pedidos", params={"status": "perdido"}).status_code == 422


def test_altera_pedido_aberto_com_patch(client, cliente):
    pedido = criar_pedido(client, cliente["id"])

    resposta = client.patch(f"/pedidos/{pedido['id']}", json={"valor": 99.9})

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.json()["valor"] == 99.9
    assert resposta.json()["descricao"] == "10 caixas de leite"


def test_patch_com_campo_nulo_responde_422(client, cliente):
    pedido = criar_pedido(client, cliente["id"])

    resposta = client.patch(f"/pedidos/{pedido['id']}", json={"descricao": None})

    assert resposta.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_fluxo_de_entrega_pela_api(client, cliente):
    pedido = criar_pedido(client, cliente["id"])

    assert mudar_status(client, pedido["id"], "em_rota").json()["status"] == "em_rota"
    assert mudar_status(client, pedido["id"], "entregue").json()["status"] == "entregue"


def test_mudanca_de_status_proibida_responde_409(client, cliente):
    pedido = criar_pedido(client, cliente["id"])

    resposta = mudar_status(client, pedido["id"], "entregue")

    assert resposta.status_code == status.HTTP_409_CONFLICT
    assert resposta.json()["detail"] == "Um pedido aberto não pode passar para entregue."


def test_pedido_em_rota_nao_pode_ser_alterado_nem_excluido(client, cliente):
    pedido = criar_pedido(client, cliente["id"])
    mudar_status(client, pedido["id"], "em_rota")

    alterar = client.patch(f"/pedidos/{pedido['id']}", json={"valor": 1})
    excluir = client.delete(f"/pedidos/{pedido['id']}")

    assert alterar.status_code == status.HTTP_409_CONFLICT
    assert excluir.status_code == status.HTTP_409_CONFLICT


def test_exclui_pedido_aberto(client, cliente):
    pedido = criar_pedido(client, cliente["id"])

    assert client.delete(f"/pedidos/{pedido['id']}").status_code == 204
    assert client.get(f"/pedidos/{pedido['id']}").status_code == 404


def test_cliente_com_pedido_nao_pode_ser_excluido_pela_api(client, cliente):
    criar_pedido(client, cliente["id"])

    resposta = client.delete(f"/clientes/{cliente['id']}")

    assert resposta.status_code == status.HTTP_409_CONFLICT
    assert resposta.json()["detail"] == "Este cliente tem pedidos e não pode ser excluído."


def test_resumo(client, cliente):
    entregue = criar_pedido(client, cliente["id"], valor=200)
    mudar_status(client, entregue["id"], "em_rota")
    mudar_status(client, entregue["id"], "entregue")
    criar_pedido(client, cliente["id"], valor=50)

    resumo = client.get("/pedidos/resumo").json()

    assert resumo == {
        "total": 2,
        "por_status": {"aberto": 1, "em_rota": 0, "entregue": 1, "cancelado": 0},
        "valor_entregue": 200.0,
    }
