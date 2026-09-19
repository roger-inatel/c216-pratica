import pytest


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

    assert response.status_code == 200
    assert response.json() == payload


def test_rota_inexistente_retorna_404(client):
    response = client.get("/rota-inexistente")

    assert response.status_code == 404
    assert "detail" in response.json()


@pytest.mark.parametrize("caminho", ["/", "/health"])
def test_post_em_rota_get_retorna_405(client, caminho):
    response = client.post(caminho)

    assert response.status_code == 405
    assert response.headers["allow"] == "GET"
