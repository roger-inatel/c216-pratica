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

## Estrutura

```text
app/
├── main.py            # cria a aplicacao e registra os routers
├── api/routes/        # endpoints, um modulo por recurso
│   ├── items.py
│   └── system.py
├── schemas/           # modelos Pydantic de entrada e saida
│   └── item.py
└── services/          # regra de negocio e armazenamento
    └── item.py
```

O fluxo e `endpoint -> service`: o router cuida do HTTP (status, erros) e o service
executa a regra de negocio. Os itens ficam em memoria; a persistencia em banco entra
na proxima pratica.

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

| Metodo | Rota                | Descricao                                      |
|--------|---------------------|------------------------------------------------|
| GET    | `/`                 | Retorna o status da API                        |
| GET    | `/health`           | Health check da aplicacao                      |
| GET    | `/items`            | Lista os itens; aceita `?limit=` (1 a 100)     |
| GET    | `/items/{item_id}`  | Retorna um item; `404` se nao existir          |
| POST   | `/items`            | Cria um item e responde `201`                  |
| PUT    | `/items/{item_id}`  | Substitui todos os campos do item              |
| PATCH  | `/items/{item_id}`  | Atualiza apenas os campos enviados             |
| DELETE | `/items/{item_id}`  | Remove o item e responde `204`                 |

A documentacao interativa fica em `http://localhost:8000/docs`.

## Testes

- `tests/unit/test_item_service.py` - regra de negocio do service, sem HTTP
- `tests/unit/test_app.py` - contrato da aplicacao: rotas e metodos declarados
- `tests/integration/test_items_api.py` - os seis endpoints de itens pelo `TestClient`
- `tests/integration/test_system_api.py` - `/`, `/health`, `/docs` e os erros 404 e 405
- `tests/conftest.py` - fixture `client` e limpeza dos itens entre os testes

Como rodar: [README da raiz](../README.md#testes).
