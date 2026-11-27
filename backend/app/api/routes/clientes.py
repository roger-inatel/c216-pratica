from fastapi import APIRouter, status

from app.api.dependencias import ClienteServiceDep
from app.schemas.cliente import ClienteCreate, ClienteRead, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("", response_model=list[ClienteRead])
def listar_clientes(service: ClienteServiceDep, busca: str | None = None):
    return service.listar(busca)


@router.get("/{cliente_id}", response_model=ClienteRead)
def buscar_cliente(cliente_id: int, service: ClienteServiceDep):
    return service.buscar(cliente_id)


@router.post("", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
def criar_cliente(dados: ClienteCreate, service: ClienteServiceDep):
    return service.criar(dados)


@router.put("/{cliente_id}", response_model=ClienteRead)
def atualizar_cliente(cliente_id: int, dados: ClienteUpdate, service: ClienteServiceDep):
    return service.atualizar(cliente_id, dados)


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_cliente(cliente_id: int, service: ClienteServiceDep) -> None:
    service.remover(cliente_id)
