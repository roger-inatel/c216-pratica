import pytest
from starlette.routing import NoMatchFound

from app.api.routes.system import health_check, read_root
from app.main import app


@pytest.fixture
def rotas() -> dict[str, set[str]]:
    # O include_router guarda cada router como um objeto proprio dentro de app.routes,
    # entao o contrato publico e lido pelo schema OpenAPI, o mesmo que alimenta o /docs.
    caminhos = app.openapi()["paths"]

    return {
        caminho: {metodo.upper() for metodo in operacoes} for caminho, operacoes in caminhos.items()
    }


def test_read_root_retorna_status_ok():
    assert read_root() == {"status": "ok"}


def test_health_check_retorna_status_healthy():
    assert health_check() == {"status": "healthy"}


def test_aplicacao_expoe_somente_as_rotas_declaradas(rotas):
    assert set(rotas) == {"/", "/health", "/items", "/items/{item_id}"}


@pytest.mark.parametrize(
    ("caminho", "metodos"),
    [
        ("/", {"GET"}),
        ("/health", {"GET"}),
        ("/items", {"GET", "POST"}),
        ("/items/{item_id}", {"GET", "PUT", "PATCH", "DELETE"}),
    ],
)
def test_rota_expoe_os_metodos_esperados(rotas, caminho, metodos):
    assert rotas[caminho] == metodos


@pytest.mark.parametrize(
    ("nome", "caminho"),
    [
        ("read_root", "/"),
        ("health_check", "/health"),
        ("listar_itens", "/items"),
    ],
)
def test_nome_da_rota_resolve_para_o_caminho(nome, caminho):
    assert app.url_path_for(nome) == caminho


def test_rota_com_path_parameter_resolve_com_o_valor():
    assert app.url_path_for("buscar_item", item_id=7) == "/items/7"


def test_nome_de_rota_inexistente_levanta_erro():
    with pytest.raises(NoMatchFound, match="rota_inexistente"):
        app.url_path_for("rota_inexistente")
