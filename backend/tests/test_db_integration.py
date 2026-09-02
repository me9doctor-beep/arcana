"""Live PostgreSQL integration tests.

These require a dedicated test database reachable via ``ARCANA_TEST_DATABASE_URL``.
They skip automatically when it is unset, and refuse to run against the normal
development database. Run explicitly with::

    ARCANA_TEST_DATABASE_URL=postgresql+psycopg://arcana:arcana@localhost:5432/arcana_test \
        pytest -m integration
"""

from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, text

from alembic import command
from app.db.session import session_scope
from tests.db_utils import resolve_test_database_url

pytestmark = pytest.mark.integration

BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def test_engine():
    url = resolve_test_database_url()
    engine = create_engine(url, pool_pre_ping=True)
    yield engine
    engine.dispose()


def test_live_database_connection(test_engine) -> None:
    with test_engine.connect() as connection:
        assert connection.execute(text("SELECT 1")).scalar() == 1


def test_live_session_scope_commits_and_rolls_back(test_engine) -> None:
    with session_scope() as session:
        session.execute(text("SELECT 1"))

    with pytest.raises(RuntimeError):
        with session_scope() as session:
            session.execute(text("SELECT 1"))
            raise RuntimeError("boom")


def test_live_alembic_upgrade_and_current(test_engine) -> None:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", resolve_test_database_url())
    command.upgrade(config, "head")
    command.current(config)
