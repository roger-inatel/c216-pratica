# C216 - Sistemas Distribuidos

Repositorio das praticas da disciplina C216 - Sistemas Distribuidos (Inatel).

## Estrutura

- `backend/` - API em FastAPI, gerenciada pelo Poetry
- `docker-compose.yml` - sobe a API junto com o banco de dados
- `Makefile` - centraliza os comandos do projeto
- `.env.example` - modelo das variaveis de ambiente; o compose tem padrao para todas, entao o projeto sobe sem `.env`

## Pre-requisitos

- `make` - executa os comandos deste repositorio
- `poetry` - gerencia as dependencias do backend
- `python` 3.11 ou superior - exigido pelo `pyproject.toml` e usado por `make help` e `make clean`
- `docker` com o plugin `compose` - apenas para os comandos de container

Se alguma ferramenta estiver instalada com outro nome, sobrescreva a variavel em vez de
editar o Makefile:

```bash
make install POETRY="python -m poetry"
make clean PYTHON=python3
```

## Execucao

```bash
make help        # lista todos os comandos disponiveis
make install     # instala as dependencias do backend
make docker-up   # sobe a API e o banco em containers
```

Detalhes do backend em [backend/README.md](backend/README.md).

## Branches

- `main` - branch principal do repositorio
- `aulas` - acumula as entregas das praticas realizadas em aula
- `projeto-final` - desenvolvimento do projeto final da disciplina

## Autor

Roger Pereira Freitas
