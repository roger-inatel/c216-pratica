from app.core.erros import Conflito, NaoEncontrado
from app.models.pedido import Pedido, StatusPedido
from app.repositories.cliente import ClienteRepository
from app.repositories.pedido import PedidoRepository
from app.schemas.pedido import PedidoCreate, PedidoUpdate, ResumoPedidos

# Caminho que um pedido pode seguir. Entregue e cancelado sao finais.
TRANSICOES: dict[StatusPedido, set[StatusPedido]] = {
    StatusPedido.ABERTO: {StatusPedido.EM_ROTA, StatusPedido.CANCELADO},
    StatusPedido.EM_ROTA: {StatusPedido.ENTREGUE, StatusPedido.CANCELADO},
    StatusPedido.ENTREGUE: set(),
    StatusPedido.CANCELADO: set(),
}

NOMES_DOS_STATUS = {
    StatusPedido.ABERTO: "aberto",
    StatusPedido.EM_ROTA: "em rota",
    StatusPedido.ENTREGUE: "entregue",
    StatusPedido.CANCELADO: "cancelado",
}


def pode_mudar_status(atual: StatusPedido, novo: StatusPedido) -> bool:
    return novo in TRANSICOES[atual]


class PedidoService:
    def __init__(self, pedidos: PedidoRepository, clientes: ClienteRepository) -> None:
        self._pedidos = pedidos
        self._clientes = clientes

    def listar(
        self, status: StatusPedido | None = None, cliente_id: int | None = None
    ) -> list[Pedido]:
        return self._pedidos.listar(status, cliente_id)

    def buscar(self, pedido_id: int) -> Pedido:
        pedido = self._pedidos.buscar(pedido_id)
        if pedido is None:
            raise NaoEncontrado("Pedido não encontrado.")
        return pedido

    def criar(self, dados: PedidoCreate) -> Pedido:
        if self._clientes.buscar(dados.cliente_id) is None:
            raise NaoEncontrado("Cliente não encontrado.")
        return self._pedidos.criar(dados.model_dump())

    def atualizar(self, pedido_id: int, dados: PedidoUpdate) -> Pedido:
        pedido = self.buscar(pedido_id)
        if pedido.status != StatusPedido.ABERTO:
            raise Conflito("Só pedidos abertos podem ser alterados.")
        for campo, valor in dados.model_dump(exclude_unset=True).items():
            setattr(pedido, campo, valor)
        return self._pedidos.salvar(pedido)

    def mudar_status(self, pedido_id: int, novo: StatusPedido) -> Pedido:
        pedido = self.buscar(pedido_id)
        atual = StatusPedido(pedido.status)
        if not pode_mudar_status(atual, novo):
            raise Conflito(
                f"Um pedido {NOMES_DOS_STATUS[atual]} não pode passar para "
                f"{NOMES_DOS_STATUS[novo]}."
            )
        pedido.status = novo
        return self._pedidos.salvar(pedido)

    def remover(self, pedido_id: int) -> None:
        pedido = self.buscar(pedido_id)
        if pedido.status in (StatusPedido.EM_ROTA, StatusPedido.ENTREGUE):
            raise Conflito("Pedidos em rota ou entregues não podem ser excluídos.")
        self._pedidos.remover(pedido)

    def resumo(self) -> ResumoPedidos:
        contagem = self._pedidos.contar_por_status()
        por_status = {status: contagem.get(status, 0) for status in StatusPedido}
        return ResumoPedidos(
            total=sum(por_status.values()),
            por_status=por_status,
            valor_entregue=self._pedidos.valor_entregue(),
        )
