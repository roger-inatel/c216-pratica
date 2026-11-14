from fastapi import status

ORIGEM_DO_FRONTEND = "http://localhost:5173"


def _preflight(client, origem, metodo="POST"):
    return client.options(
        "/items",
        headers={
            "Origin": origem,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_preflight_do_frontend_e_autorizado(client):
    resposta = _preflight(client, ORIGEM_DO_FRONTEND)

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_DO_FRONTEND


def test_preflight_libera_os_metodos_usados_pelo_frontend(client):
    for metodo in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
        resposta = _preflight(client, ORIGEM_DO_FRONTEND, metodo)

        assert resposta.status_code == status.HTTP_200_OK, metodo


def test_preflight_de_origem_desconhecida_e_recusado(client):
    resposta = _preflight(client, "http://site-qualquer.com")

    assert resposta.status_code == status.HTTP_400_BAD_REQUEST
    assert "access-control-allow-origin" not in resposta.headers


def test_resposta_simples_traz_o_cabecalho_so_para_a_origem_autorizada(client):
    autorizada = client.get("/items", headers={"Origin": ORIGEM_DO_FRONTEND})
    desconhecida = client.get("/items", headers={"Origin": "http://site-qualquer.com"})

    assert autorizada.headers["access-control-allow-origin"] == ORIGEM_DO_FRONTEND
    assert "access-control-allow-origin" not in desconhecida.headers


def test_cors_nao_usa_curinga(client):
    resposta = _preflight(client, ORIGEM_DO_FRONTEND)

    assert resposta.headers["access-control-allow-origin"] != "*"
