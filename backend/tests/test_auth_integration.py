"""Live PostgreSQL authentication-flow integration tests.

Require ``ARCANA_TEST_DATABASE_URL`` (a dedicated, disposable test database).
Run with::

    ARCANA_TEST_DATABASE_URL=postgresql+psycopg://arcana:arcana@localhost:5432/arcana_test \
        pytest -m integration
"""

import uuid
from pathlib import Path

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session

from alembic import command
from app.db.session import get_db
from app.main import create_app
from tests.db_utils import resolve_test_database_url

pytestmark = pytest.mark.integration

BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def migrated_engine():
    url = resolve_test_database_url()
    engine = create_engine(url, pool_pre_ping=True)
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "head")
    yield engine
    engine.dispose()


@pytest.fixture
def integration_client(migrated_engine):
    application = create_app()

    def override_get_db():
        with Session(migrated_engine) as session:
            yield session

    application.dependency_overrides[get_db] = override_get_db
    with TestClient(application) as client:
        yield client


def test_migration_creates_auth_tables(migrated_engine) -> None:
    inspector = inspect(migrated_engine)
    table_names = set(inspector.get_table_names())

    assert {"users", "auth_sessions", "alembic_version"} <= table_names


def test_full_auth_flow_against_postgres(integration_client, migrated_engine) -> None:
    email = f"it-{uuid.uuid4().hex[:12]}@example.com"
    password = "correct-horse-battery-staple"

    # Registration
    register = integration_client.post(
        "/api/v1/auth/register", json={"email": email, "password": password}
    )
    assert register.status_code == 201, register.text
    access_token = register.json()["access_token"]
    refresh_token = register.json()["refresh_token"]

    # Current user
    me = integration_client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert me.status_code == 200, me.text
    assert me.json()["email"] == email

    # Login
    login = integration_client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert login.status_code == 200, login.text

    # Refresh (rotation)
    refreshed = integration_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refreshed.status_code == 200, refreshed.text
    new_refresh = refreshed.json()["refresh_token"]

    # Old refresh token must be rejected after rotation.
    replay = integration_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert replay.status_code == 401

    # Logout revokes the new session.
    logout = integration_client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh})
    assert logout.status_code == 204

    # A revoked session cannot refresh.
    after_logout = integration_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": new_refresh}
    )
    assert after_logout.status_code == 401

    # Clean up the created rows so the module fixture can be reused.
    with migrated_engine.begin() as connection:
        connection.execute(text("DELETE FROM auth_sessions"))
        connection.execute(text("DELETE FROM users"))
