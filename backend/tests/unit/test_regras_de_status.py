import pytest

from app.models.pedido import StatusPedido as S
from app.services.pedido import TRANSICOES, pode_mudar_status


@pytest.mark.parametrize(
    ("atual", "novo"),
    [
        (S.ABERTO, S.EM_ROTA),
        (S.ABERTO, S.CANCELADO),
        (S.EM_ROTA, S.ENTREGUE),
        (S.EM_ROTA, S.CANCELADO),
    ],
)
def test_caminhos_permitidos(atual, novo):
    assert pode_mudar_status(atual, novo)


@pytest.mark.parametrize(
    ("atual", "novo"),
    [
        (S.ABERTO, S.ENTREGUE),
        (S.EM_ROTA, S.ABERTO),
        (S.ENTREGUE, S.CANCELADO),
        (S.CANCELADO, S.ABERTO),
        (S.ABERTO, S.ABERTO),
    ],
)
def test_caminhos_proibidos(atual, novo):
    assert not pode_mudar_status(atual, novo)


@pytest.mark.parametrize("final", [S.ENTREGUE, S.CANCELADO])
def test_entregue_e_cancelado_sao_finais(final):
    assert TRANSICOES[final] == set()


def test_todo_status_tem_regra_definida():
    assert set(TRANSICOES) == set(S)
