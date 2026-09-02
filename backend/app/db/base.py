"""Declarative base and metadata naming conventions.

Every ARCANA model subclasses :class:`Base`, which centralizes metadata and
deterministic constraint/index names so Alembic autogenerate produces stable,
reviewable diffs instead of database-generated random names.
"""

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Deterministic names for unnamed constraints/indexes. The ``%`` tokens are
# substituted by SQLAlchemy, e.g. ``pk_accounts``, ``fk_missions_project_id_projects``.
# Check constraints should be named explicitly so the ``%(constraint_name)s``
# token is always populated.
NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Declarative base for all ARCANA ORM models."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)
