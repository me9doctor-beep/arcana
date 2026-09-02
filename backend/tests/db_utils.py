"""Helpers for PostgreSQL integration tests (safe test-database resolution).

These guards make it impossible to accidentally run migrations or auth flows
against a developer's normal database: the URL must be explicitly provided, must
differ from ``DATABASE_URL``, and must reference a database whose name contains
"test".
"""

import pytest
from sqlalchemy.engine import make_url

from app.core.config import settings


def resolve_test_database_url() -> str:
    """Return a safe test-database URL, or skip/fail the test run."""
    test_url = settings.test_database_url
    if not test_url:
        pytest.skip("ARCANA_TEST_DATABASE_URL is not set — PostgreSQL integration tests skipped")

    test = make_url(test_url)
    dev = make_url(settings.database_url)

    if (test.host, test.port, test.database) == (dev.host, dev.port, dev.database):
        pytest.fail(
            "ARCANA_TEST_DATABASE_URL must reference a dedicated test database, "
            "not the development database"
        )

    if "test" not in (test.database or "").lower():
        pytest.fail("ARCANA_TEST_DATABASE_URL must reference a database whose name contains 'test'")

    return test_url
