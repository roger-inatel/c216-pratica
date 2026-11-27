from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator

from app.models.pedido import StatusPedido

ValorEmReais = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]
# Sem isto o Pydantic devolve o Decimal como texto ("49.90") no JSON.
ValorNoJson = Annotated[Decimal, PlainSerializer(float, return_type=float)]


class PedidoCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    cliente_id: int = Field(gt=0)
    descricao: str = Field(min_length=1, max_length=200)
    valor: ValorEmReais


class PedidoUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    descricao: str | None = Field(default=None, min_length=1, max_length=200)
    valor: ValorEmReais | None = None

    @field_validator("descricao", "valor")
    @classmethod
    def _nao_pode_ser_nulo(cls, valor):
        # Os campos sao opcionais no PATCH, mas mandar null apagaria um dado obrigatorio.
        if valor is None:
            raise ValueError("o campo nao pode ser nulo")
        return valor


class StatusUpdate(BaseModel):
    status: StatusPedido


class PedidoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_id: int
    cliente_nome: str
    descricao: str
    valor: ValorNoJson
    status: StatusPedido
    criado_em: datetime
    atualizado_em: datetime


class ResumoPedidos(BaseModel):
    total: int
    por_status: dict[StatusPedido, int]
    valor_entregue: ValorNoJson
