# Relatorio da Pratica 1 - Git/GitHub, Poetry e Makefile

**Disciplina:** C216 - Sistemas Distribuidos
**Aluno:** Roger Pereira Freitas

## 1. Git/GitHub

- Criacao do repositorio `c216-pratica-1`.
- Professor adicionado como colaborador com permissao de administrador.
- Criacao da branch `aulas`, destinada a acumular as entregas das praticas.
- Criacao da branch `projeto-final`, reservada ao projeto final da disciplina.
- Branch `pratica-1` criada a partir de `aulas` para o desenvolvimento desta entrega.
- Labels do repositorio registradas e aplicadas ao Pull Request.

## 2. Poetry

O Poetry foi inicializado dentro da pasta `backend/`, gerando o `pyproject.toml`
e o `poetry.lock` que descrevem e travam as dependencias do projeto.

Bibliotecas adicionadas:

| Pacote               | Grupo | Finalidade                                  |
|----------------------|-------|---------------------------------------------|
| `fastapi`            | main  | Framework web para construcao da API        |
| `uvicorn[standard]`  | main  | Servidor ASGI que executa a aplicacao       |
| `pytest`             | dev   | Execucao dos testes automatizados           |
| `ruff`               | dev   | Lint e formatacao do codigo                 |

Para validar o ambiente, foi criada uma aplicacao minima em `backend/app/main.py`
com as rotas `GET /` e `GET /health`.

## 3. Makefile

O `Makefile` na raiz do repositorio centraliza os comandos do projeto e contempla
os tres requisitos pedidos na pratica:

- **Variaveis:** `BACKEND_DIR`, `POETRY`, `UVICORN_HOST` e `UVICORN_PORT`, evitando
  repeticao de caminhos e facilitando a manutencao dos alvos.
- **`.PHONY`:** declara `help`, `install`, `run`, `test`, `lint`, `format` e `clean`
  como alvos que nao produzem arquivos, garantindo que sempre sejam executados.
- **`make help`:** alvo padrao de documentacao, que lista todos os comandos
  disponiveis e suas descricoes.

Alvos implementados:

| Comando        | Descricao                                        |
|----------------|--------------------------------------------------|
| `make help`    | Lista os comandos disponiveis                    |
| `make install` | Instala as dependencias do backend via Poetry     |
| `make run`     | Sobe o servidor FastAPI em modo desenvolvimento   |
| `make test`    | Executa a suite de testes com pytest              |
| `make lint`    | Verifica o codigo com o ruff                      |
| `make format`  | Formata o codigo automaticamente                  |
| `make clean`   | Remove caches e arquivos temporarios              |

## Estrutura final

```
c216-pratica-1/
├── Makefile
├── README.md
├── RELATORIO.md
├── .gitignore
└── backend/
    ├── README.md
    ├── pyproject.toml
    ├── poetry.lock
    └── app/
        ├── __init__.py
        └── main.py
```
