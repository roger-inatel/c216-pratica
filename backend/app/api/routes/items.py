from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate
from app.services.item import ItemJaExiste, ItemNaoEncontrado, ItemService

router = APIRouter(prefix="/items", tags=["Items"])


def get_item_service(db: Annotated[Session, Depends(get_db)]) -> ItemService:
    return ItemService(ItemRepository(db))


ServiceDep = Annotated[ItemService, Depends(get_item_service)]
LimitDep = Annotated[int, Query(ge=1, le=100)]


def _nao_encontrado(erro: ItemNaoEncontrado) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


def _conflito(erro: ItemJaExiste) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))


@router.get("", response_model=list[ItemRead])
def listar_itens(service: ServiceDep, limit: LimitDep = 10):
    return service.listar(limit)


@router.get("/{item_id}", response_model=ItemRead)
def buscar_item(item_id: int, service: ServiceDep):
    try:
        return service.buscar(item_id)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro


@router.post("", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def criar_item(dados: ItemCreate, service: ServiceDep):
    try:
        return service.criar(dados)
    except ItemJaExiste as erro:
        raise _conflito(erro) from erro


@router.put("/{item_id}", response_model=ItemRead)
def substituir_item(item_id: int, dados: ItemCreate, service: ServiceDep):
    try:
        return service.substituir(item_id, dados)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro
    except ItemJaExiste as erro:
        raise _conflito(erro) from erro


@router.patch("/{item_id}", response_model=ItemRead)
def atualizar_item(item_id: int, dados: ItemUpdate, service: ServiceDep):
    try:
        return service.atualizar(item_id, dados)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro
    except ItemJaExiste as erro:
        raise _conflito(erro) from erro


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_item(item_id: int, service: ServiceDep) -> None:
    try:
        service.remover(item_id)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro
