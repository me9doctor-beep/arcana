"""Authentication endpoint tests (run against the in-memory SQLite test DB)."""

import uuid
from datetime import timedelta

import jwt
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_refresh_token, utcnow
from app.models.auth_session import AuthSession
from app.models.user import User

PASSWORD = "correct-horse-battery-staple"
EMAIL = "user@example.com"


def _register(client, email=EMAIL, password=PASSWORD):
    return client.post("/api/v1/auth/register", json={"email": email, "password": password})


def _login(client, email=EMAIL, password=PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def _refresh(client, refresh_token):
    return client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})


def _logout(client, refresh_token):
    return client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})


def _me(client, token):
    return client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})


# ── Registration ─────────────────────────────────────────────────────────────
def test_register_returns_credentials_and_201(auth_client) -> None:
    response = _register(auth_client)

    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == settings.access_token_expire_minutes * 60
    assert "password" not in body
    assert "password_hash" not in body


def test_register_duplicate_email_is_conflict(auth_client) -> None:
    assert _register(auth_client).status_code == 201

    duplicate = _register(auth_client, email=EMAIL.upper())

    assert duplicate.status_code == 409


def test_register_normalizes_email(auth_client) -> None:
    response = _register(auth_client, email="  User@Example.COM  ")

    assert response.status_code == 201
    token = response.json()["access_token"]
    me = _me(auth_client, token)
    assert me.status_code == 200
    assert me.json()["email"] == EMAIL


def test_register_weak_password_is_rejected(auth_client) -> None:
    response = _register(auth_client, email="weak@example.com", password="short")

    assert response.status_code == 422


def test_register_invalid_email_is_rejected(auth_client) -> None:
    response = _register(auth_client, email="not-an-email", password=PASSWORD)

    assert response.status_code == 422


def test_registered_user_is_active_by_default(auth_client) -> None:
    token = _register(auth_client).json()["access_token"]

    me = _me(auth_client, token)
    assert me.json()["is_active"] is True


# ── Login ────────────────────────────────────────────────────────────────────
def test_login_valid_credentials(auth_client) -> None:
    _register(auth_client)

    response = _login(auth_client)

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["refresh_token"]


def test_login_wrong_password_is_generic_401(auth_client) -> None:
    _register(auth_client)

    response = _login(auth_client, password="wrong-password")

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid email or password."


def test_login_unknown_email_does_not_enumerate(auth_client) -> None:
    response = _login(auth_client, email="nobody@example.com")

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid email or password."


def test_login_inactive_user_is_rejected(auth_client, db_session) -> None:
    _register(auth_client)
    user = db_session.scalar(select(User))
    user.is_active = False
    db_session.commit()

    response = _login(auth_client)

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid email or password."


def test_login_creates_a_session(auth_client, db_session) -> None:
    _register(auth_client)

    _login(auth_client)

    assert db_session.scalar(select(AuthSession)) is not None


# ── /auth/me ─────────────────────────────────────────────────────────────────
def test_me_with_valid_token(auth_client) -> None:
    token = _register(auth_client).json()["access_token"]

    response = _me(auth_client, token)

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == EMAIL
    assert body["is_active"] is True
    assert "password_hash" not in body
    assert "password" not in body


def test_me_missing_token_is_401(auth_client) -> None:
    response = auth_client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_me_invalid_token_is_401(auth_client) -> None:
    response = _me(auth_client, "not-a-valid-token")

    assert response.status_code == 401


def test_me_wrong_signature_is_401(auth_client) -> None:
    token = jwt.encode(
        {"sub": str(uuid.uuid4()), "exp": utcnow() + timedelta(minutes=5), "type": "access"},
        "a-different-signing-key-that-is-not-the-real-one",
        algorithm=settings.jwt_algorithm,
    )

    response = _me(auth_client, token)

    assert response.status_code == 401


def test_me_expired_token_is_401(auth_client) -> None:
    token = jwt.encode(
        {"sub": str(uuid.uuid4()), "exp": utcnow() - timedelta(minutes=1), "type": "access"},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    response = _me(auth_client, token)

    assert response.status_code == 401


def test_me_alg_none_is_401(auth_client) -> None:
    token = jwt.encode(
        {"sub": str(uuid.uuid4()), "exp": utcnow() + timedelta(minutes=5), "type": "access"},
        key=None,
        algorithm="none",
    )

    response = _me(auth_client, token)

    assert response.status_code == 401


def test_me_inactive_user_is_401(auth_client, db_session) -> None:
    token = _register(auth_client).json()["access_token"]
    user = db_session.scalar(select(User))
    user.is_active = False
    db_session.commit()

    response = _me(auth_client, token)

    assert response.status_code == 401


# ── Refresh ──────────────────────────────────────────────────────────────────
def test_refresh_issues_new_credentials(auth_client) -> None:
    refresh_token = _register(auth_client).json()["refresh_token"]

    response = _refresh(auth_client, refresh_token)

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"] != refresh_token


def test_refresh_rotates_and_rejects_old_token(auth_client) -> None:
    old_refresh = _register(auth_client).json()["refresh_token"]

    new_refresh = _refresh(auth_client, old_refresh).json()["refresh_token"]
    assert _refresh(auth_client, new_refresh).status_code == 200

    replay = _refresh(auth_client, old_refresh)
    assert replay.status_code == 401


def test_refresh_unknown_token_is_401(auth_client) -> None:
    response = _refresh(auth_client, "opaque-token-that-was-never-issued")

    assert response.status_code == 401


def test_refresh_expired_session_is_401(auth_client, db_session) -> None:
    refresh_token = _register(auth_client).json()["refresh_token"]
    session = db_session.scalar(select(AuthSession))
    session.expires_at = utcnow() - timedelta(hours=1)
    db_session.commit()

    response = _refresh(auth_client, refresh_token)

    assert response.status_code == 401


def test_refresh_revoked_session_is_401(auth_client) -> None:
    refresh_token = _register(auth_client).json()["refresh_token"]
    assert _logout(auth_client, refresh_token).status_code == 204

    response = _refresh(auth_client, refresh_token)

    assert response.status_code == 401


def test_refresh_inactive_user_is_401(auth_client, db_session) -> None:
    refresh_token = _register(auth_client).json()["refresh_token"]
    user = db_session.scalar(select(User))
    user.is_active = False
    db_session.commit()

    response = _refresh(auth_client, refresh_token)

    assert response.status_code == 401


# ── Logout ───────────────────────────────────────────────────────────────────
def test_logout_revokes_session(auth_client, db_session) -> None:
    refresh_token = _register(auth_client).json()["refresh_token"]

    assert _logout(auth_client, refresh_token).status_code == 204

    session = db_session.scalar(select(AuthSession))
    assert session.revoked_at is not None
    assert _refresh(auth_client, refresh_token).status_code == 401


def test_logout_is_idempotent(auth_client) -> None:
    refresh_token = _register(auth_client).json()["refresh_token"]

    assert _logout(auth_client, refresh_token).status_code == 204
    assert _logout(auth_client, refresh_token).status_code == 204


def test_logout_unknown_token_is_204(auth_client) -> None:
    assert _logout(auth_client, "never-issued").status_code == 204


# ── Security: secrets never leak ─────────────────────────────────────────────
def test_refresh_token_hash_never_leaks(auth_client) -> None:
    register_response = _register(auth_client)
    refresh_token = register_response.json()["refresh_token"]
    access_token = register_response.json()["access_token"]

    digest = hash_refresh_token(refresh_token)

    for response in (
        _login(auth_client),
        _refresh(auth_client, refresh_token),
        _me(auth_client, access_token),
    ):
        assert digest not in response.text


def test_jwt_secret_never_leaks(auth_client) -> None:
    token = _register(auth_client).json()["access_token"]

    for response in (_login(auth_client), _me(auth_client, token)):
        assert settings.jwt_secret_key not in response.text
