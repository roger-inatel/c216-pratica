from decimal import Decimal

import pytest

from app.core.erros import Conflito, NaoEncontrado
from app.models.pedido import StatusPedido
from app.repositories.cliente import ClienteRepository
from app.repositories.pedido import PedidoRepository
from app.schemas.cliente import ClienteCreate
from app.schemas.pedido import PedidoCreate, PedidoUpdate
from app.services.cliente import ClienteService
from app.services.pedido import PedidoService


@pytest.fixture
def clientes(sessao):
    return ClienteService(ClienteRepository(sessao))


@pytest.fixture
def pedidos(sessao):
    return PedidoService(PedidoRepository(sessao), ClienteRepository(sessao))


def novo_cliente(service, telefone="35999990000", nome="Mercado Central"):
    return service.criar(ClienteCreate(nome=nome, telefone=telefone, endereco="Rua A, 10"))


def novo_pedido(service, cliente_id, valor="100.00"):
    return service.criar(
        PedidoCreate(cliente_id=cliente_id, descricao="10 caixas de leite", valor=valor)
    )


def test_telefone_repetido_e_recusado(clientes):
    novo_cliente(clientes)

    with pytest.raises(Conflito, match="telefone"):
        novo_cliente(clientes, nome="Outro mercado")


def test_varios_clientes_podem_ficar_sem_telefone(clientes):
    novo_cliente(clientes, telefone=None)
    novo_cliente(clientes, telefone=None, nome="Padaria")

    assert len(clientes.listar()) == 2


def test_atualizar_mantendo_o_proprio_telefone(clientes):
    cliente = novo_cliente(clientes)

    atualizado = clientes.atualizar(
        cliente.id,
        ClienteCreate(nome="Mercado Novo", telefone="35999990000", endereco="Rua B, 5"),
    )

    assert atualizado.nome == "Mercado Novo"


def test_cliente_com_pedidos_nao_pode_ser_excluido(clientes, pedidos):
    cliente = novo_cliente(clientes)
    novo_pedido(pedidos, cliente.id)

    with pytest.raises(Conflito, match="tem pedidos"):
        clientes.remover(cliente.id)


def test_pedido_para_cliente_inexistente(pedidos):
    with pytest.raises(NaoEncontrado, match="Cliente"):
        novo_pedido(pedidos, cliente_id=999)


def test_pedido_nasce_aberto(clientes, pedidos):
    pedido = novo_pedido(pedidos, novo_cliente(clientes).id)

    assert pedido.status == StatusPedido.ABERTO
    assert pedido.cliente_nome == "Mercado Central"


def test_fluxo_completo_ate_a_entrega(clientes, pedidos):
    pedido = novo_pedido(pedidos, novo_cliente(clientes).id)

    pedidos.mudar_status(pedido.id, StatusPedido.EM_ROTA)
    entregue = pedidos.mudar_status(pedido.id, StatusPedido.ENTREGUE)

    assert entregue.status == StatusPedido.ENTREGUE


def test_nao_pula_direto_para_entregue(clientes, pedidos):
    pedido = novo_pedido(pedidos, novo_cliente(clientes).id)

    with pytest.raises(Conflito, match="aberto não pode passar para entregue"):
        pedidos.mudar_status(pedido.id, StatusPedido.ENTREGUE)


def test_so_pedido_aberto_pode_ser_alterado(clientes, pedidos):
    pedido = novo_pedido(pedidos, novo_cliente(clientes).id)
    pedidos.mudar_status(pedido.id, StatusPedido.EM_ROTA)

    with pytest.raises(Conflito, match="abertos"):
        pedidos.atualizar(pedido.id, PedidoUpdate(valor="1.00"))


def test_alterar_so_o_valor_mantem_a_descricao(clientes, pedidos):
    pedido = novo_pedido(pedidos, novo_cliente(clientes).id)

    alterado = pedidos.atualizar(pedido.id, PedidoUpdate(valor="80.50"))

    assert alterado.valor == Decimal("80.50")
    assert alterado.descricao == "10 caixas de leite"


@pytest.mark.parametrize("status_final", [StatusPedido.EM_ROTA, StatusPedido.ENTREGUE])
def test_pedido_em_rota_ou_entregue_nao_pode_ser_excluido(clientes, pedidos, status_final):
    pedido = novo_pedido(pedidos, novo_cliente(clientes).id)
    pedidos.mudar_status(pedido.id, StatusPedido.EM_ROTA)
    if status_final == StatusPedido.ENTREGUE:
        pedidos.mudar_status(pedido.id, StatusPedido.ENTREGUE)

    with pytest.raises(Conflito, match="não podem ser excluídos"):
        pedidos.remover(pedido.id)


def test_pedido_cancelado_pode_ser_excluido(clientes, pedidos):
    pedido = novo_pedido(pedidos, novo_cliente(clientes).id)
    pedidos.mudar_status(pedido.id, StatusPedido.CANCELADO)

    pedidos.remover(pedido.id)

    with pytest.raises(NaoEncontrado):
        pedidos.buscar(pedido.id)


def test_resumo_conta_por_status_e_soma_so_o_entregue(clientes, pedidos):
    cliente_id = novo_cliente(clientes).id
    entregue = novo_pedido(pedidos, cliente_id, valor="150.00")
    pedidos.mudar_status(entregue.id, StatusPedido.EM_ROTA)
    pedidos.mudar_status(entregue.id, StatusPedido.ENTREGUE)
    novo_pedido(pedidos, cliente_id, valor="40.00")

    resumo = pedidos.resumo()

    assert resumo.total == 2
    assert resumo.por_status[StatusPedido.ABERTO] == 1
    assert resumo.por_status[StatusPedido.ENTREGUE] == 1
    assert resumo.por_status[StatusPedido.CANCELADO] == 0
    assert resumo.valor_entregue == Decimal("150.00")
