from app.core.config import ler_origens


def test_separa_as_origens_por_virgula():
    assert ler_origens("http://localhost:5173,http://127.0.0.1:5173") == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_ignora_espacos_e_itens_vazios():
    assert ler_origens(" http://localhost:3000 , ,") == ["http://localhost:3000"]
