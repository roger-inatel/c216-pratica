class ErroDeNegocio(Exception):
    """Erro de regra que a API devolve ao cliente com uma mensagem legivel."""

    status_code = 400

    def __init__(self, mensagem: str) -> None:
        super().__init__(mensagem)
        self.mensagem = mensagem


class NaoEncontrado(ErroDeNegocio):
    status_code = 404


class Conflito(ErroDeNegocio):
    status_code = 409
