import pytest
from fastapi import status

from app.core.config import ler_origens

FRONTEND = "http://localhost:5173"


def preflight(client, origem, metodo):
    return client.options(
        "/pedidos",
        headers={
            "Origin": origem,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_health(client):
    assert client.get("/health").json() == {"status": "healthy"}


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "PATCH", "DELETE"])
def test_cors_libera_os_metodos_usados_pelo_frontend(client, metodo):
    resposta = preflight(client, FRONTEND, metodo)

    assert resposta.status_code == status.HTTP_200_OK
    assert resposta.headers["access-control-allow-origin"] == FRONTEND


def test_cors_recusa_origem_desconhecida(client):
    resposta = preflight(client, "http://site-qualquer.com", "POST")

    assert resposta.status_code == status.HTTP_400_BAD_REQUEST
    assert "access-control-allow-origin" not in resposta.headers


def test_leitura_das_origens_ignora_espacos_e_vazios():
    assert ler_origens(" http://a:1 , ,http://b:2") == ["http://a:1", "http://b:2"]
