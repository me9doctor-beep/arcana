"""Password hashing, access-token signing, and refresh-token helpers.

All cryptographic primitives come from established libraries (Argon2id via
``argon2-cffi``, signed JWTs via ``PyJWT``). Nothing custom is invented here.
"""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import settings

# Argon2id with argon2-cffi's secure defaults (time_cost=3, memory_cost=64 MiB,
# parallelism=4). Kept deliberately non-configurable: these are appropriate for
# production and fast enough for development/tests.
_hasher = PasswordHasher()


def utcnow() -> datetime:
    """Current time as an aware UTC datetime."""
    return datetime.now(UTC)


def hash_password(password: str) -> str:
    """Hash a plaintext password with Argon2id (never stored in plaintext)."""
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against an Argon2id hash in constant time.

    Returns ``False`` (never raises) for wrong passwords and malformed hashes.
    """
    try:
        return _hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def create_access_token(user_id: uuid.UUID) -> str:
    """Create a short-lived, signed JWT access token.

    Claims: ``sub`` (user id), ``iat``, ``exp``, ``jti`` (unique id), and a
    ``type`` discriminator. No sensitive personal/business data is embedded.
    """
    now = utcnow()
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "jti": uuid.uuid4().hex,
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and verify an access token.

    The accepted algorithm is explicitly constrained to the configured value
    (never taken from the token header), so ``alg=none`` and algorithm-confusion
    attacks are rejected by PyJWT.
    """
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("token is not an access token")
    return payload


def generate_refresh_token() -> str:
    """Generate an opaque, high-entropy refresh token (only the digest is stored)."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """SHA-256 digest of a refresh token — the value persisted server-side."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
