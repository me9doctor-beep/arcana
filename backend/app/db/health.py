"""Database readiness check (liveness vs. readiness)."""

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_engine


def check_database() -> bool:
    """Return ``True`` if the database accepts connections and answers ``SELECT 1``.

    Used by the readiness endpoint. Never raises: connectivity problems map to
    ``False`` so a failed database does not crash the process. The check is
    lightweight (a single ``SELECT 1``) and exposes no credentials or connection
    details.
    """
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
    except (SQLAlchemyError, OSError):
        return False
    return True
