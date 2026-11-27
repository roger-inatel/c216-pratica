from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

Telefone = Annotated[str, Field(min_length=8, max_length=20, pattern=r"^[0-9()+\- ]+$")]


class ClienteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1, max_length=100)
    telefone: Telefone | None = None
    endereco: str = Field(min_length=1, max_length=200)


# O PUT substitui o cadastro inteiro, entao pede os mesmos campos da criacao.
ClienteUpdate = ClienteCreate


class ClienteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    telefone: str | None
    endereco: str
    criado_em: datetime
