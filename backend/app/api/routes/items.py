from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.services.item import ItemNaoEncontrado, item_service

router = APIRouter(prefix="/items", tags=["Items"])


def _nao_encontrado(erro: ItemNaoEncontrado) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.get("", response_model=list[Item])
def listar_itens(limit: Annotated[int, Query(ge=1, le=100)] = 10) -> list[Item]:
    return item_service.listar(limit)


@router.get("/{item_id}", response_model=Item)
def buscar_item(item_id: int) -> Item:
    try:
        return item_service.buscar(item_id)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro


@router.post("", response_model=Item, status_code=status.HTTP_201_CREATED)
def criar_item(dados: ItemCreate) -> Item:
    return item_service.criar(dados)


@router.put("/{item_id}", response_model=Item)
def substituir_item(item_id: int, dados: ItemCreate) -> Item:
    try:
        return item_service.substituir(item_id, dados)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro


@router.patch("/{item_id}", response_model=Item)
def atualizar_item(item_id: int, dados: ItemUpdate) -> Item:
    try:
        return item_service.atualizar(item_id, dados)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_item(item_id: int) -> None:
    try:
        item_service.remover(item_id)
    except ItemNaoEncontrado as erro:
        raise _nao_encontrado(erro) from erro
