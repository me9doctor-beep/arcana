"""Alembic configuration tests (offline, no database required)."""

from pathlib import Path

from alembic.config import Config

from alembic import command

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return config


def test_alembic_config_has_script_location() -> None:
    config = _config()

    assert config.get_main_option("script_location")
    assert Path(config.get_main_option("script_location")).is_dir()


def test_alembic_offline_upgrade_generates_sql(capsys) -> None:
    # Offline mode emits SQL without connecting to a database.
    command.upgrade(_config(), "head", sql=True)

    output = capsys.readouterr().out
    assert "BEGIN" in output
    assert "COMMIT" in output
