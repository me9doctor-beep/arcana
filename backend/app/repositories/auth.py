"""Data access for the authentication domain.

Repositories never commit or roll back — transaction ownership stays in the
service layer (see ``app/services/auth.py``).
"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auth_session import AuthSession
from app.models.user import User


class UserRepository:
    """Queries and persistence for :class:`User` rows."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def create(self, *, email: str, password_hash: str) -> User:
        user = User(email=email, password_hash=password_hash)
        self.db.add(user)
        return user


class AuthSessionRepository:
    """Queries and persistence for :class:`AuthSession` rows."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_refresh_hash(self, digest: str) -> AuthSession | None:
        return self.db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == digest))

    def create(
        self,
        *,
        user_id: uuid.UUID,
        refresh_token_hash: str,
        expires_at,
    ) -> AuthSession:
        session = AuthSession(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
        )
        self.db.add(session)
        return session
