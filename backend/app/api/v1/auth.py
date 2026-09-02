"""Authentication endpoints under ``/api/v1/auth``."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account",
)
def register(body: RegisterRequest, db: DbSession) -> TokenResponse:
    """Create an account and issue access/refresh credentials."""
    return AuthService(db).register(body.email, body.password)


@router.post("/login", response_model=TokenResponse, summary="Log in")
def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    """Verify credentials and issue access/refresh credentials."""
    return AuthService(db).login(body.email, body.password)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh credentials")
def refresh(body: RefreshRequest, db: DbSession) -> TokenResponse:
    """Rotate a refresh token into a new access/refresh credential pair."""
    return AuthService(db).refresh(body.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out",
)
def logout(body: LogoutRequest, db: DbSession) -> None:
    """Revoke the refresh session; the access token expires naturally."""
    AuthService(db).logout(body.refresh_token)


@router.get("/me", response_model=UserResponse, summary="Current user")
def me(current_user: CurrentUser) -> User:
    """Return the authenticated user."""
    return current_user
