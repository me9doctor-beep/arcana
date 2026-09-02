"""Shared pytest fixtures.

Unit tests run against an in-process ASGI application wired to an in-memory
SQLite database — never a developer's PostgreSQL. Live PostgreSQL integration
tests live in ``test_*_integration.py`` and skip unless
``ARCANA_TEST_DATABASE_URL`` is set.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import create_app


@pytest.fixture
def app():
    """Return a fresh ARCANA application instance (no database wiring)."""
    return create_app()


@pytest.fixture
def client(app):
    """Return a TestClient bound to the application."""
    with TestClient(app) as test_client:
        yield test_client


def _enable_sqlite_foreign_keys(dbapi_connection, connection_record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@pytest.fixture
def db_engine():
    """In-memory SQLite engine with the ARCANA schema (unit tests only)."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    event.listen(engine, "connect", _enable_sqlite_foreign_keys)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine):
    """A SQLAlchemy session bound to the in-memory test database."""
    with Session(db_engine) as session:
        yield session


@pytest.fixture
def auth_app(db_engine):
    """Application whose ``get_db`` resolves to the in-memory test database."""
    application = create_app()

    def override_get_db():
        with Session(db_engine) as session:
            yield session

    application.dependency_overrides[get_db] = override_get_db
    yield application


@pytest.fixture
def auth_client(auth_app):
    """TestClient bound to the database-wired application."""
    with TestClient(auth_app) as test_client:
        yield test_client
