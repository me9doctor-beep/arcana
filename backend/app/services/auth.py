"""Authentication business logic.

Each public method is a single transaction boundary: it validates, mutates, and
commits exactly once (rolling back on failure). Repositories never commit.
"""

import logging
import uuid
from datetime import timedelta

import jwt
from sqlalchemy import func, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    utcnow,
    verify_password,
)
from app.models.auth_session import AuthSession
from app.models.user import User
from app.repositories.auth import AuthSessionRepository, UserRepository
from app.schemas.auth import TokenResponse

logger = logging.getLogger("arcana.auth")

# A single generic message for every login failure, so the API does not reveal
# whether an email exists, the password was wrong, or the account is inactive.
_INVALID_CREDENTIALS = "Invalid email or password."
_INVALID_TOKEN = "Invalid or expired refresh token."
_INVALID_ACCESS = "Invalid or expired access token."


def normalize_email(email: str) -> str:
    """Deterministic email normalization (trim + lowercase)."""
    return email.strip().lower()


class AuthService:
    """Authentication flows: registration, login, refresh, logout, and me."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.sessions = AuthSessionRepository(db)

    # ── helpers ─────────────────────────────────────────────────────────────
    def _issue_token_pair(self, user: User) -> TokenResponse:
        """Create a refresh session and return access + refresh credentials."""
        raw_refresh = generate_refresh_token()
        self.sessions.create(
            user_id=user.id,
            refresh_token_hash=hash_refresh_token(raw_refresh),
            expires_at=utcnow() + timedelta(days=settings.refresh_token_expire_days),
        )
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=raw_refresh,
        )

    # ── flows ───────────────────────────────────────────────────────────────
    def register(self, email: str, password: str) -> TokenResponse:
        """Create a user and immediately issue credentials.

        Tokens are issued on registration so the client can enter ARCANA without
        a second round-trip; the same security properties as login apply.
        """
        normalized = normalize_email(email)
        if self.users.get_by_email(normalized) is not None:
            raise ConflictError("An account with this email already exists.")

        user = self.users.create(email=normalized, password_hash=hash_password(password))
        try:
            self.db.flush()  # fire UUID default + INSERT; surfaces duplicate-email races
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("An account with this email already exists.") from exc

        tokens = self._issue_token_pair(user)
        self.db.commit()
        logger.info("user registered: %s", user.id)
        return tokens

    def login(self, email: str, password: str) -> TokenResponse:
        """Verify credentials and issue a new refresh session."""
        user = self.users.get_by_email(normalize_email(email))
        if user is None or not verify_password(password, user.password_hash):
            logger.warning("login failed for email %r", email)
            raise AuthenticationError(_INVALID_CREDENTIALS)
        if not user.is_active:
            logger.warning("login attempted for inactive user %s", user.id)
            raise AuthenticationError(_INVALID_CREDENTIALS)

        user.last_login_at = utcnow()
        tokens = self._issue_token_pair(user)
        self.db.commit()
        logger.info("login succeeded for user %s", user.id)
        return tokens

    def refresh(self, raw_refresh_token: str) -> TokenResponse:
        """Rotate a refresh credential: revoke the old session, issue a new one.

        Replay protection: the revocation is a conditional UPDATE (``revoked_at
        IS NULL AND expires_at > now()``), so the first concurrent refresh wins
        and any reuse of the same credential afterwards finds zero rows and is
        rejected.
        """
        digest = hash_refresh_token(raw_refresh_token)
        session = self.sessions.get_by_refresh_hash(digest)
        if session is None or session.revoked_at is not None:
            raise AuthenticationError(_INVALID_TOKEN)

        result = self.db.execute(
            update(AuthSession)
            .where(
                AuthSession.id == session.id,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > func.now(),
            )
            .values(revoked_at=func.now(), last_used_at=func.now())
        )
        if result.rowcount != 1:
            self.db.rollback()
            logger.warning("refresh rejected (expired/replayed) for session %s", session.id)
            raise AuthenticationError(_INVALID_TOKEN)

        user = self.users.get_by_id(session.user_id)
        if user is None or not user.is_active:
            self.db.rollback()
            raise AuthenticationError(_INVALID_TOKEN)

        tokens = self._issue_token_pair(user)
        self.db.commit()
        return tokens

    def logout(self, raw_refresh_token: str) -> None:
        """Revoke the session backing a refresh token (idempotent)."""
        digest = hash_refresh_token(raw_refresh_token)
        self.db.execute(
            update(AuthSession)
            .where(
                AuthSession.refresh_token_hash == digest,
                AuthSession.revoked_at.is_(None),
            )
            .values(revoked_at=func.now())
        )
        self.db.commit()

    def get_current_user(self, access_token: str) -> User:
        """Resolve the authenticated user from a validated access token."""
        try:
            payload = decode_access_token(access_token)
        except jwt.InvalidTokenError:
            raise AuthenticationError(_INVALID_ACCESS) from None

        try:
            user_id = uuid.UUID(payload["sub"])
        except (KeyError, ValueError, TypeError):
            raise AuthenticationError(_INVALID_ACCESS) from None

        user = self.users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise AuthenticationError(_INVALID_ACCESS)
        return user
