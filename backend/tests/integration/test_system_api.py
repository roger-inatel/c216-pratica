import pytest
from fastapi import status


@pytest.mark.parametrize(
    ("caminho", "payload"),
    [
        ("/", {"status": "ok"}),
        ("/health", {"status": "healthy"}),
    ],
    ids=["raiz", "health"],
)
def test_get_na_rota_retorna_200_e_payload(client, caminho, payload):
    response = client.get(caminho)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == payload


def test_rota_inexistente_retorna_404(client):
    response = client.get("/rota-inexistente")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()


@pytest.mark.parametrize("caminho", ["/", "/health"])
def test_post_em_rota_get_retorna_405(client, caminho):
    response = client.post(caminho)

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.headers["allow"] == "GET"


def test_documentacao_interativa_responde(client):
    assert client.get("/docs").status_code == status.HTTP_200_OK
    assert "/items" in client.get("/openapi.json").json()["paths"]
