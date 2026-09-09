from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_read_root_retorna_ok():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_check_retorna_healthy():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
