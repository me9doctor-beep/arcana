"""Declarative base and column-convention tests (no database required)."""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import NAMING_CONVENTION, Base
from app.db.mixins import TimestampMixin, UUIDPkMixin


class _SampleModel(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "_sample_model"

    name: Mapped[str] = mapped_column(sa.String(64), nullable=False)


def test_naming_convention_covers_required_constraints() -> None:
    for key in ("pk", "fk", "uq", "ck", "ix"):
        assert key in NAMING_CONVENTION


def test_base_metadata_uses_naming_convention() -> None:
    assert Base.metadata.naming_convention == NAMING_CONVENTION


def test_models_package_imports_cleanly() -> None:
    import app.models  # noqa: F401  (model discovery hook used by Alembic)

    assert app.models.__doc__


def test_uuid_pk_and_timestamp_columns() -> None:
    columns = _SampleModel.__table__.columns

    assert "id" in columns
    assert isinstance(columns["id"].type, sa.Uuid)
    assert columns["id"].primary_key is True
    assert columns["created_at"].type.timezone is True
    assert columns["updated_at"].type.timezone is True


def test_primary_key_gets_deterministic_name() -> None:
    assert _SampleModel.__table__.primary_key.name == "pk__sample_model"


def test_table_compiles_to_postgres_ddl() -> None:
    ddl = sa.schema.CreateTable(_SampleModel.__table__).compile(dialect=postgresql.dialect())

    assert "UUID" in str(ddl)
    assert "TIMESTAMP WITH TIME ZONE" in str(ddl)
    assert "CONSTRAINT pk__sample_model PRIMARY KEY (id)" in str(ddl)
