"""The ARCANA authentication session model (refresh-session store).

A session represents one issued refresh credential. Only the SHA-256 digest of
the refresh token is stored — never the raw token — so a database leak does not
leak usable refresh credentials.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPkMixin


class AuthSession(UUIDPkMixin, TimestampMixin, Base):
    """A server-side refresh session bound to a user."""

    __tablename__ = "auth_sessions"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # SHA-256 hex digest (64 chars) of the raw refresh token. Unique so a given
    # credential maps to exactly one session.
    refresh_token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Set when the session is revoked (logout or rotation). A revoked session
    # can never produce a new credential.
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
