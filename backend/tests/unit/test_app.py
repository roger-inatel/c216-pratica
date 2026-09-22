import pytest
from fastapi.routing import APIRoute
from starlette.routing import NoMatchFound

from app.main import app, health_check, read_root


@pytest.fixture
def rotas() -> dict[str, APIRoute]:
    return {rota.path: rota for rota in app.routes if isinstance(rota, APIRoute)}


def test_read_root_retorna_status_ok():
    assert read_root() == {"status": "ok"}


def test_health_check_retorna_status_healthy():
    assert health_check() == {"status": "healthy"}


def test_aplicacao_expoe_somente_as_rotas_declaradas(rotas):
    assert set(rotas) == {"/", "/health"}


@pytest.mark.parametrize("caminho", ["/", "/health"])
def test_rota_aceita_apenas_get(rotas, caminho):
    assert rotas[caminho].methods == {"GET"}


@pytest.mark.parametrize(
    ("nome", "caminho"),
    [
        ("read_root", "/"),
        ("health_check", "/health"),
    ],
)
def test_nome_da_rota_resolve_para_o_caminho(nome, caminho):
    assert app.url_path_for(nome) == caminho


def test_nome_de_rota_inexistente_levanta_erro():
    with pytest.raises(NoMatchFound, match="rota_inexistente"):
        app.url_path_for("rota_inexistente")
