from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.pedido import Pedido, StatusPedido


class PedidoRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def listar(
        self, status: StatusPedido | None = None, cliente_id: int | None = None
    ) -> list[Pedido]:
        consulta = select(Pedido).order_by(Pedido.id.desc())
        if status:
            consulta = consulta.where(Pedido.status == status)
        if cliente_id:
            consulta = consulta.where(Pedido.cliente_id == cliente_id)
        return list(self._db.scalars(consulta))

    def buscar(self, pedido_id: int) -> Pedido | None:
        return self._db.get(Pedido, pedido_id)

    def criar(self, dados: dict) -> Pedido:
        pedido = Pedido(**dados, status=StatusPedido.ABERTO)
        self._db.add(pedido)
        return self.salvar(pedido)

    def salvar(self, pedido: Pedido) -> Pedido:
        self._db.commit()
        self._db.refresh(pedido)
        return pedido

    def remover(self, pedido: Pedido) -> None:
        self._db.delete(pedido)
        self._db.commit()

    def contar_por_status(self) -> dict[str, int]:
        linhas = self._db.execute(select(Pedido.status, func.count()).group_by(Pedido.status))
        return {status: quantidade for status, quantidade in linhas}

    def valor_entregue(self) -> Decimal:
        total = self._db.scalar(
            select(func.sum(Pedido.valor)).where(Pedido.status == StatusPedido.ENTREGUE)
        )
        return Decimal(total or 0)
