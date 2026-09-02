"""Health endpoint tests."""

from app.core.config import settings


def test_root_health_returns_ok(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_v1_health_returns_ok(client) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_v1_router_respects_configured_prefix(client) -> None:
    response = client.get(f"{settings.api_v1_prefix}/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_schema_is_available(client) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "ARCANA"
    assert "/api/v1/health" in schema["paths"]
