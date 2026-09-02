"""The ARCANA identity model.

Identity-only in Phase 03: no organization, department, team, role, or profile
fields. Those are added by later phases.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, text, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPkMixin


class User(UUIDPkMixin, TimestampMixin, Base):
    """An ARCANA account (email + password credentials)."""

    __tablename__ = "users"

    # Stored in normalized form (lowercased, trimmed). The functional unique
    # index below enforces case-insensitive uniqueness at the database level,
    # so two rows can never share an email regardless of application code.
    email: Mapped[str] = mapped_column(String(255), nullable=False)

    # Argon2id hash. Never returned by the API and never logged.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Inactive accounts cannot authenticate, refresh, or access /auth/me.
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=true()
    )

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("uq_users_email_ci", text("lower(email)"), unique=True),)
