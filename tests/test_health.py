def test_healthcheck(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_page(client) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "app": "Sistema de Escala de Professores",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }
