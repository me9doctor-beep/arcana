"""Readiness endpoint tests (database check is monkeypatched)."""

import app.api.router as root_router
import app.api.v1.health as v1_health


def test_readiness_ok_when_database_available(client, monkeypatch) -> None:
    monkeypatch.setattr(root_router, "check_database", lambda: True)

    response = client.get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "ok"}


def test_readiness_503_when_database_unavailable(client, monkeypatch) -> None:
    monkeypatch.setattr(root_router, "check_database", lambda: False)

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "not_ready", "database": "unavailable"}


def test_v1_readiness(client, monkeypatch) -> None:
    monkeypatch.setattr(v1_health, "check_database", lambda: True)

    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "ok"}


def test_readiness_does_not_leak_connection_details(client, monkeypatch) -> None:
    monkeypatch.setattr(root_router, "check_database", lambda: False)

    response = client.get("/health/ready")
    body = response.text

    assert "postgres" not in body
    assert "password" not in body
    assert "@" not in body
