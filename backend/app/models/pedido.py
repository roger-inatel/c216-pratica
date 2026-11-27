from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.cliente import Cliente


class StatusPedido(StrEnum):
    ABERTO = "aberto"
    EM_ROTA = "em_rota"
    ENTREGUE = "entregue"
    CANCELADO = "cancelado"


class Pedido(Base):
    __tablename__ = "pedidos"
    __table_args__ = (
        CheckConstraint("valor > 0", name="ck_pedidos_valor_positivo"),
        CheckConstraint(
            "status IN ('aberto', 'em_rota', 'entregue', 'cancelado')",
            name="ck_pedidos_status_valido",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # RESTRICT: o banco tambem impede apagar um cliente que ainda tem pedidos.
    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("clientes.id", ondelete="RESTRICT"), index=True
    )
    descricao: Mapped[str] = mapped_column(String(200))
    valor: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(20), default=StatusPedido.ABERTO, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    cliente: Mapped["Cliente"] = relationship(back_populates="pedidos", lazy="joined")

    @property
    def cliente_nome(self) -> str:
        return self.cliente.nome
