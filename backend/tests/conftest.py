import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.database.base import Base
from app.database.session import get_db
from app.main import app


def _criar_engine():
    url = os.getenv("TEST_DATABASE_URL")
    if url:
        return create_engine(url)

    # Sem banco configurado a suite roda em SQLite na memoria. O StaticPool mantem a
    # mesma conexao viva: com o pool padrao, cada sessao abriria um banco vazio novo.
    return create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


engine = _criar_engine()
TestSessionLocal = sessionmaker(bind=engine, autoflush=False)


def _sessao_de_teste() -> Iterator[Session]:
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def _banco_do_teste() -> Iterator[None]:
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def sessao() -> Iterator[Session]:
    yield from _sessao_de_teste()


@pytest.fixture
def client() -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = _sessao_de_teste
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
