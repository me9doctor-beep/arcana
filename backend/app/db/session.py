"""SQLAlchemy engine, session factory, and session lifecycle.

The engine is created once (lazily) and shared; sessions are short-lived and
never global. Transaction ownership is documented in the README: services use
:func:`session_scope`, while the :func:`get_db` FastAPI dependency provides a
per-request session that is rolled back on error and always closed.
"""

from collections.abc import Generator, Iterator
from contextlib import contextmanager
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, settings


def build_engine(config: Settings) -> Engine:
    """Build a SQLAlchemy engine from configuration (no connection is made).

    Pool behavior is fully configurable; production values come from
    environment/settings, never from hardcoded credentials. ``connect_timeout``
    is passed through to the psycopg 3 driver (ARCANA is PostgreSQL-only).
    """
    return create_engine(
        config.database_url,
        echo=config.debug,
        pool_pre_ping=config.db_pool_pre_ping,
        pool_size=config.db_pool_size,
        max_overflow=config.db_max_overflow,
        pool_timeout=config.db_pool_timeout,
        pool_recycle=config.db_pool_recycle,
        connect_args={"connect_timeout": config.db_connect_timeout},
    )


@lru_cache
def get_engine() -> Engine:
    """Return the process-wide engine, built lazily on first use."""
    return build_engine(settings)


def dispose_engine() -> None:
    """Close pooled connections (called on application shutdown)."""
    get_engine().dispose()


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Build a session factory bound to ``engine``."""
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


SessionLocal = build_session_factory(get_engine())


@contextmanager
def session_scope() -> Iterator[Session]:
    """Provide a transactional scope for a group of operations.

    Commits on success, rolls back on exception, and always closes the session.
    This is the preferred service-layer transaction boundary: a service performs
    several operations atomically and commits once.
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a short-lived session per request.

    Does not auto-commit: services own commit boundaries via
    :func:`session_scope`. On error the session is rolled back and is always
    closed, so no request leaves a session in a broken transactional state.

    Usage::

        def route(db: Session = Depends(get_db)) -> ...:
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
