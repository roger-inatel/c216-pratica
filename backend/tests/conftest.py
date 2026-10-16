from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.item import item_service


@pytest.fixture(autouse=True)
def _itens_vazios() -> None:
    # O servico guarda os itens em memoria: sem isso, um teste herdaria os dados do outro.
    item_service.limpar()


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
