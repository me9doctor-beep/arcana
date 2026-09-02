"""Authentication dependencies (FastAPI dependency injection).

Provides the reusable ``get_current_user`` dependency so future endpoints can
require an authenticated user without duplicating token handling.
"""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError
from app.db.session import get_db
from app.models.user import User
from app.services.auth import AuthService

# ``auto_error=False`` so a missing/malformed header yields ``None`` and we can
# return a consistent 401 (HTTPBearer's default would emit 403).
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Resolve the authenticated, active user from the ``Authorization`` header.

    Raises :class:`AuthenticationError` (401) for a missing header, malformed,
    expired, or mis-signed token, an unknown user, or an inactive account.
    """
    if credentials is None or not credentials.credentials:
        raise AuthenticationError("Not authenticated.")
    return AuthService(db).get_current_user(credentials.credentials)
