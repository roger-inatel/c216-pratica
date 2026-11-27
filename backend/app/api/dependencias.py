from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.cliente import ClienteRepository
from app.repositories.pedido import PedidoRepository
from app.services.cliente import ClienteService
from app.services.pedido import PedidoService

SessaoDep = Annotated[Session, Depends(get_db)]


def get_cliente_service(db: SessaoDep) -> ClienteService:
    return ClienteService(ClienteRepository(db))


def get_pedido_service(db: SessaoDep) -> PedidoService:
    return PedidoService(PedidoRepository(db), ClienteRepository(db))


ClienteServiceDep = Annotated[ClienteService, Depends(get_cliente_service)]
PedidoServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]
