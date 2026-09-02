"""Centralized application configuration.

All settings are read from environment variables (optionally a local ``.env``
file) via pydantic-settings. Secrets and environment-specific values are never
hardcoded here.
"""

from functools import lru_cache
from typing import Annotated

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Local-development placeholder only. Never used in production.
_DEV_JWT_SECRET = "arcana-insecure-development-secret-change-me-now"


class Settings(BaseSettings):
    """Application settings with safe development defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "ARCANA"
    app_env: str = "development"  # development | testing | staging | production
    app_version: str = "0.1.0"
    debug: bool = False

    # API
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+psycopg://arcana:arcana@localhost:5432/arcana"

    # Connection pooling (development defaults; production values are set via
    # environment). ``db_connect_timeout`` is passed to the psycopg 3 driver.
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800
    db_pool_pre_ping: bool = True
    db_connect_timeout: int = 5

    # Authentication
    jwt_secret_key: str = _DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 14
    password_min_length: int = 8

    # Integration-test database (must be a dedicated, disposable database).
    test_database_url: str | None = None

    # CORS — comma-separated list of allowed browser origins (as a string in .env)
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://localhost:4173",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        """Accept a comma-separated string or a list and normalize to a list."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _require_strong_secret_in_production(self) -> "Settings":
        if self.app_env == "production" and (
            len(self.jwt_secret_key) < 32 or self.jwt_secret_key == _DEV_JWT_SECRET
        ):
            raise ValueError(
                "JWT_SECRET_KEY must be set to a strong secret (>= 32 characters) in production"
            )
        return self

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Return a cached :class:`Settings` instance (single source of truth)."""
    return Settings()


settings = get_settings()
