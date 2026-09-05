# Backend

API do projeto, construida com FastAPI e gerenciada pelo Poetry.

## Dependencias

- `fastapi` - framework web para construcao da API
- `uvicorn[standard]` - servidor ASGI usado para executar a aplicacao
- `pytest` (dev) - execucao dos testes
- `ruff` (dev) - lint e formatacao
- `httpx2` (dev) - cliente HTTP exigido pelo TestClient do FastAPI

O projeto e uma aplicacao, nao uma biblioteca: o `pyproject.toml` declara
`package-mode = false`, e o codigo e executado a partir de `app/` em vez de ser
instalado como pacote.

## Execucao local

A partir da raiz do repositorio:

```bash
make install   # instala as dependencias
make run       # sobe a API em http://localhost:8000
make test      # roda os testes
make lint      # verifica o codigo com o ruff
```

## Execucao em container

Tambem a partir da raiz:

```bash
make docker-up     # sobe a API e o banco
make docker-ps     # mostra o status dos servicos
make docker-down   # derruba tudo
```

`make help` lista todos os comandos disponiveis.

## Rotas

| Metodo | Rota      | Descricao                  |
|--------|-----------|----------------------------|
| GET    | `/`       | Retorna o status da API    |
| GET    | `/health` | Health check da aplicacao  |

## Testes

Os testes ficam em `tests/` e cobrem as duas rotas acima.
