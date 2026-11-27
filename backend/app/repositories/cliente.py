from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.models.pedido import Pedido


class ClienteRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def listar(self, busca: str | None = None) -> list[Cliente]:
        consulta = select(Cliente).order_by(Cliente.nome)
        if busca:
            consulta = consulta.where(Cliente.nome.ilike(f"%{busca}%"))
        return list(self._db.scalars(consulta))

    def buscar(self, cliente_id: int) -> Cliente | None:
        return self._db.get(Cliente, cliente_id)

    def buscar_por_telefone(self, telefone: str) -> Cliente | None:
        return self._db.scalar(select(Cliente).where(Cliente.telefone == telefone))

    def tem_pedidos(self, cliente_id: int) -> bool:
        return bool(self._db.scalar(select(exists().where(Pedido.cliente_id == cliente_id))))

    def criar(self, dados: dict) -> Cliente:
        cliente = Cliente(**dados)
        self._db.add(cliente)
        return self._salvar(cliente)

    def atualizar(self, cliente: Cliente, dados: dict) -> Cliente:
        for campo, valor in dados.items():
            setattr(cliente, campo, valor)
        return self._salvar(cliente)

    def remover(self, cliente: Cliente) -> None:
        self._db.delete(cliente)
        self._db.commit()

    def _salvar(self, cliente: Cliente) -> Cliente:
        self._db.commit()
        self._db.refresh(cliente)
        return cliente
