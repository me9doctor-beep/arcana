"""Pydantic schemas for the authentication API."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.config import settings


class RegisterRequest(BaseModel):
    """Registration request (email + password)."""

    email: EmailStr
    password: str = Field(
        min_length=settings.password_min_length,
        max_length=128,
        description="Plaintext password; minimum length is enforced by policy.",
    )


class LoginRequest(BaseModel):
    """Login request (email + password)."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Refresh request (opaque refresh token)."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout request (the refresh token whose session should be revoked)."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Access + refresh credentials issued to the client."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = settings.access_token_expire_minutes * 60


class UserResponse(BaseModel):
    """Public representation of a user (never includes credentials)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    is_active: bool
    created_at: datetime
