"""Reusable column conventions for future models.

These mixins encode the ARCANA identifier and timestamp conventions so every
domain model follows them consistently. They are opt-in: a model inherits them
only when it needs those columns, and they never create tables on their own.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPkMixin:
    """Application-generated UUID primary key (native PostgreSQL ``UUID``).

    IDs are generated in Python (``uuid.uuid4``) so entities can be created
    without a database round-trip and are unique across environments. Do not mix
    integer primary keys into the same schema.
    """

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    """UTC, timezone-aware ``created_at`` / ``updated_at`` timestamps.

    Defaults are applied by the database (``now()`` → ``CURRENT_TIMESTAMP``),
    and ``updated_at`` is refreshed on update by SQLAlchemy. Stored values are
    always timezone-aware; serialize them as ISO-8601 UTC strings.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
