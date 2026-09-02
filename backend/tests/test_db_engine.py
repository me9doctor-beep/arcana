"""Engine construction and settings tests (no database connection is made)."""

from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool

from app.core.config import Settings
from app.db.session import build_engine


def _settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "database_url": "postgresql+psycopg://user:secret@dbhost:5433/arcana",
        "debug": False,
        "db_pool_size": 7,
        "db_max_overflow": 13,
        "db_pool_timeout": 15,
        "db_pool_recycle": 120,
        "db_pool_pre_ping": False,
        "db_connect_timeout": 3,
    }
    values.update(overrides)
    return Settings(**values)


def test_settings_provide_sensible_pool_defaults() -> None:
    config = Settings()

    assert config.db_pool_size >= 1
    assert config.db_max_overflow >= 0
    assert config.db_pool_timeout > 0
    assert config.db_pool_recycle > 0
    assert config.db_pool_pre_ping is True
    assert config.db_connect_timeout > 0


def test_engine_targets_postgres() -> None:
    engine = build_engine(_settings())

    assert isinstance(engine, Engine)
    assert engine.url.drivername == "postgresql+psycopg"
    assert engine.url.database == "arcana"
    assert engine.url.host == "dbhost"
    assert engine.url.port == 5433


def test_engine_never_exposes_password() -> None:
    engine = build_engine(_settings())

    rendered = engine.url.render_as_string(hide_password=True)
    assert "secret" not in rendered


def test_engine_pool_settings_are_applied() -> None:
    engine = build_engine(_settings())
    pool = engine.pool

    assert isinstance(pool, QueuePool)
    assert pool.timeout() == 15
    # QueuePool does not expose these publicly; reached into for verification only.
    assert pool._pool.maxsize == 7
    assert pool._max_overflow == 13
    assert pool._recycle == 120
    assert pool._pre_ping is False


def test_engine_echo_tracks_debug() -> None:
    assert build_engine(_settings(debug=True)).echo is True
    assert build_engine(_settings(debug=False)).echo is False
