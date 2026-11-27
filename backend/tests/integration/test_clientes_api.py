from fastapi import status

CLIENTE = {"nome": "Mercado Central", "telefone": "(35) 99999-0000", "endereco": "Rua A, 10"}


def criar_cliente(client, **mudancas):
    resposta = client.post("/clientes", json={**CLIENTE, **mudancas})
    assert resposta.status_code == status.HTTP_201_CREATED, resposta.json()
    return resposta.json()


def test_cria_e_busca_cliente(client):
    criado = criar_cliente(client)

    resposta = client.get(f"/clientes/{criado['id']}")

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.json()["nome"] == "Mercado Central"
    assert "criado_em" in resposta.json()


def test_remove_espacos_das_pontas(client):
    criado = criar_cliente(client, nome="  Padaria Pão Bom  ")

    assert criado["nome"] == "Padaria Pão Bom"


def test_lista_em_ordem_alfabetica_e_filtra_por_nome(client):
    criar_cliente(client, nome="Padaria", telefone=None)
    criar_cliente(client, nome="Açougue", telefone=None)
    criar_cliente(client, nome="Mercado", telefone=None)

    todos = [c["nome"] for c in client.get("/clientes").json()]
    filtrados = [c["nome"] for c in client.get("/clientes", params={"busca": "pad"}).json()]

    assert todos == ["Açougue", "Mercado", "Padaria"]
    assert filtrados == ["Padaria"]


def test_atualiza_cliente_com_put(client):
    criado = criar_cliente(client)

    resposta = client.put(
        f"/clientes/{criado['id']}", json={**CLIENTE, "endereco": "Av. Brasil, 200"}
    )

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.json()["endereco"] == "Av. Brasil, 200"


def test_telefone_repetido_responde_409(client):
    criar_cliente(client)

    resposta = client.post("/clientes", json={**CLIENTE, "nome": "Outro"})

    assert resposta.status_code == status.HTTP_409_CONFLICT
    assert resposta.json()["detail"] == "Já existe um cliente com esse telefone."


def test_exclui_cliente_sem_pedidos(client):
    criado = criar_cliente(client)

    resposta = client.delete(f"/clientes/{criado['id']}")

    assert resposta.status_code == status.HTTP_204_NO_CONTENT
    assert client.get(f"/clientes/{criado['id']}").status_code == status.HTTP_404_NOT_FOUND


def test_cliente_inexistente_responde_404(client):
    for resposta in (
        client.get("/clientes/999"),
        client.put("/clientes/999", json=CLIENTE),
        client.delete("/clientes/999"),
    ):
        assert resposta.status_code == status.HTTP_404_NOT_FOUND
        assert resposta.json()["detail"] == "Cliente não encontrado."


def test_dados_invalidos_respondem_422(client):
    invalidos = [
        {**CLIENTE, "nome": ""},
        {**CLIENTE, "nome": "x" * 101},
        {**CLIENTE, "telefone": "abc"},
        {"nome": "Sem endereço"},
    ]
    for payload in invalidos:
        resposta = client.post("/clientes", json=payload)
        assert resposta.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT, payload
