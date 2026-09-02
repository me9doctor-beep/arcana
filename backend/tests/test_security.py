"""Password-hashing and token security tests (no database required)."""

import uuid
from datetime import timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    utcnow,
    verify_password,
)


# ── Password hashing ─────────────────────────────────────────────────────────
def test_hash_is_not_plaintext() -> None:
    digest = hash_password("correct-horse-battery-staple")

    assert digest != "correct-horse-battery-staple"
    assert "correct-horse" not in digest


def test_hash_uses_argon2id() -> None:
    assert hash_password("some-password").startswith("$argon2id$")


def test_verify_correct_password() -> None:
    digest = hash_password("sup3r-secret")

    assert verify_password("sup3r-secret", digest) is True


def test_verify_wrong_password_fails() -> None:
    digest = hash_password("sup3r-secret")

    assert verify_password("wrong-password", digest) is False


def test_verify_malformed_hash_fails_cleanly() -> None:
    assert verify_password("anything", "not-a-valid-hash") is False


def test_hashes_are_salted() -> None:
    first = hash_password("same-password")
    second = hash_password("same-password")

    assert first != second


# ── Access tokens ────────────────────────────────────────────────────────────
def test_access_token_roundtrip() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert payload["type"] == "access"


def test_expired_token_is_rejected() -> None:
    payload = {
        "sub": str(uuid.uuid4()),
        "iat": utcnow(),
        "exp": utcnow() - timedelta(minutes=1),
        "type": "access",
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_wrong_signature_is_rejected() -> None:
    token = jwt.encode(
        {"sub": str(uuid.uuid4()), "exp": utcnow() + timedelta(minutes=5), "type": "access"},
        "a-different-signing-key-that-is-not-the-real-one",
        algorithm=settings.jwt_algorithm,
    )

    with pytest.raises(jwt.InvalidSignatureError):
        decode_access_token(token)


def test_malformed_token_is_rejected() -> None:
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token("not-a-jwt")


def test_alg_none_is_rejected() -> None:
    token = jwt.encode(
        {"sub": str(uuid.uuid4()), "exp": utcnow() + timedelta(minutes=5), "type": "access"},
        key=None,
        algorithm="none",
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_unsupported_algorithm_is_rejected() -> None:
    token = jwt.encode(
        {"sub": str(uuid.uuid4()), "exp": utcnow() + timedelta(minutes=5), "type": "access"},
        settings.jwt_secret_key,
        algorithm="HS384",
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_non_access_token_type_is_rejected() -> None:
    payload = {
        "sub": str(uuid.uuid4()),
        "iat": utcnow(),
        "exp": utcnow() + timedelta(minutes=5),
        "type": "refresh",
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


# ── Refresh tokens ───────────────────────────────────────────────────────────
def test_refresh_tokens_are_unique_and_high_entropy() -> None:
    first = generate_refresh_token()
    second = generate_refresh_token()

    assert first != second
    assert len(first) >= 48


def test_refresh_token_digest_is_not_reversible() -> None:
    raw = generate_refresh_token()
    digest = hash_refresh_token(raw)

    assert digest != raw
    assert len(digest) == 64
    assert hash_refresh_token(raw) == digest
