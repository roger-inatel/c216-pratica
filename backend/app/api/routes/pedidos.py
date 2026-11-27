from fastapi import APIRouter, status

from app.api.dependencias import PedidoServiceDep
from app.models.pedido import StatusPedido
from app.schemas.pedido import (
    PedidoCreate,
    PedidoRead,
    PedidoUpdate,
    ResumoPedidos,
    StatusUpdate,
)

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.get("", response_model=list[PedidoRead])
def listar_pedidos(
    service: PedidoServiceDep,
    status: StatusPedido | None = None,
    cliente_id: int | None = None,
):
    return service.listar(status, cliente_id)


# Declarada antes de /{pedido_id} para "resumo" nao ser lido como um id.
@router.get("/resumo", response_model=ResumoPedidos)
def resumo_dos_pedidos(service: PedidoServiceDep):
    return service.resumo()


@router.get("/{pedido_id}", response_model=PedidoRead)
def buscar_pedido(pedido_id: int, service: PedidoServiceDep):
    return service.buscar(pedido_id)


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def criar_pedido(dados: PedidoCreate, service: PedidoServiceDep):
    return service.criar(dados)


@router.patch("/{pedido_id}", response_model=PedidoRead)
def atualizar_pedido(pedido_id: int, dados: PedidoUpdate, service: PedidoServiceDep):
    return service.atualizar(pedido_id, dados)


@router.patch("/{pedido_id}/status", response_model=PedidoRead)
def mudar_status_do_pedido(pedido_id: int, dados: StatusUpdate, service: PedidoServiceDep):
    return service.mudar_status(pedido_id, dados.status)


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_pedido(pedido_id: int, service: PedidoServiceDep) -> None:
    service.remover(pedido_id)
