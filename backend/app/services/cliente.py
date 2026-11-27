from app.core.erros import Conflito, NaoEncontrado
from app.models.cliente import Cliente
from app.repositories.cliente import ClienteRepository
from app.schemas.cliente import ClienteCreate, ClienteUpdate


class ClienteService:
    def __init__(self, clientes: ClienteRepository) -> None:
        self._clientes = clientes

    def listar(self, busca: str | None = None) -> list[Cliente]:
        return self._clientes.listar(busca)

    def buscar(self, cliente_id: int) -> Cliente:
        cliente = self._clientes.buscar(cliente_id)
        if cliente is None:
            raise NaoEncontrado("Cliente não encontrado.")
        return cliente

    def criar(self, dados: ClienteCreate) -> Cliente:
        self._garantir_telefone_livre(dados.telefone)
        return self._clientes.criar(dados.model_dump())

    def atualizar(self, cliente_id: int, dados: ClienteUpdate) -> Cliente:
        cliente = self.buscar(cliente_id)
        self._garantir_telefone_livre(dados.telefone, ignorar_id=cliente.id)
        return self._clientes.atualizar(cliente, dados.model_dump())

    def remover(self, cliente_id: int) -> None:
        cliente = self.buscar(cliente_id)
        if self._clientes.tem_pedidos(cliente.id):
            raise Conflito("Este cliente tem pedidos e não pode ser excluído.")
        self._clientes.remover(cliente)

    def _garantir_telefone_livre(self, telefone: str | None, ignorar_id: int | None = None) -> None:
        if not telefone:
            return
        dono = self._clientes.buscar_por_telefone(telefone)
        if dono is not None and dono.id != ignorar_id:
            raise Conflito("Já existe um cliente com esse telefone.")
