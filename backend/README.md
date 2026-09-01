# Backend

API do projeto, construida com FastAPI e gerenciada pelo Poetry.

## Dependencias

- `fastapi` - framework web para construcao da API
- `uvicorn[standard]` - servidor ASGI usado para executar a aplicacao
- `pytest` (dev) - execucao dos testes
- `ruff` (dev) - lint e formatacao

## Execucao

A partir da raiz do repositorio:

```bash
make install   # instala as dependencias
make run       # sobe a API em http://localhost:8000
```

## Rotas

| Metodo | Rota      | Descricao                  |
|--------|-----------|----------------------------|
| GET    | `/`       | Retorna o status da API    |
| GET    | `/health` | Health check da aplicacao  |
