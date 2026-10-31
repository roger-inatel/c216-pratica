from pydantic import BaseModel, ConfigDict, Field, field_validator


class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class ItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def _nome_nao_pode_ser_nulo(cls, valor: str | None) -> str | None:
        # O campo e opcional, mas a coluna nao aceita nulo: enviar "name": null
        # precisa virar 422, e nao um erro do banco.
        if valor is None:
            raise ValueError("name nao pode ser nulo")

        return valor


class ItemRead(BaseModel):
    # O service devolve o objeto do SQLAlchemy; from_attributes permite ler os campos
    # dele direto, sem converter a mao em cada rota.
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
