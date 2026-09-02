# ARCANA — Backend

The backend for **ARCANA**, a futuristic work-management and gamification
operating system. ARCANA turns the work of a company into a world worth
exploring: real projects, missions, sprints and teams are surfaced through an
immersive game layer.

> **Work is the reality. The game is the representation of that reality.**

## Current status

- **Backend Phase 01 — Foundation & Architecture** is complete.
- **Backend Phase 02 — Database Architecture & Migrations** is complete.
- **Backend Phase 03 — Authentication & Session Management** is complete.
- Not yet implemented: organizations, departments, teams, roles, employees,
  projects, missions, Scrum, gamification, AI, analytics. Those arrive in later
  phases on top of this foundation.

## Technology stack

| Concern           | Technology                        |
| ----------------- | --------------------------------- |
| Language          | Python 3.11+                      |
| Web framework     | FastAPI                           |
| Validation        | Pydantic v2 + pydantic-settings   |
| ORM / data access | SQLAlchemy 2.x                    |
| Database          | PostgreSQL (psycopg 3 driver)     |
| Migrations        | Alembic                           |
| Authentication    | Argon2id (argon2-cffi) + signed JWTs (PyJWT) |
| Testing           | Pytest + FastAPI `TestClient`     |
| Server            | Uvicorn                           |
| Linting / format  | Ruff                              |

## Project layout

```text
backend/
├── app/
│   ├── main.py              # application factory + entrypoint (`app`)
│   ├── api/                 # HTTP layer
│   │   ├── router.py        # top-level routes (e.g. /health)
│   │   └── v1/              # versioned API (/api/v1/...)
│   ├── core/                # config, logging, exceptions
│   ├── db/                  # base (naming), mixins, session, health
│   ├── models/              # SQLAlchemy models (user, auth_session)
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # business logic (auth service)
│   ├── repositories/        # data-access layer (auth repositories)
│   └── dependencies/        # FastAPI dependencies (get_current_user)
├── tests/
├── alembic/                 # migration environment
├── alembic.ini
├── pyproject.toml
└── .env.example
```

## Prerequisites

- Python 3.11+
- PostgreSQL 14+ (run locally, or use the root `docker-compose.yml`)

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env    # then adjust values as needed
```

## Configuration

All configuration comes from environment variables (optionally a local `.env`
file). See `.env.example` for the full list:

| Variable         | Default                                                    | Description                                   |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `APP_NAME`       | `ARCANA`                                                   | Application name                              |
| `APP_ENV`        | `development`                                              | `development` / `testing` / `staging` / `production` |
| `APP_VERSION`    | `0.1.0`                                                    | Version reported by health & OpenAPI          |
| `DEBUG`          | `false`                                                    | Debug mode (tracebacks, SQL echo)             |
| `API_V1_PREFIX`  | `/api/v1`                                                  | Base path for the versioned API               |
| `DATABASE_URL`   | `postgresql+psycopg://arcana:arcana@localhost:5432/arcana` | SQLAlchemy database URL                       |
| `DB_POOL_SIZE`   | `5`                                                        | Connection pool size                          |
| `DB_MAX_OVERFLOW`| `10`                                                       | Extra connections allowed beyond pool size    |
| `DB_POOL_TIMEOUT`| `30`                                                       | Seconds to wait for a pooled connection       |
| `DB_POOL_RECYCLE`| `1800`                                                     | Seconds before a connection is recycled       |
| `DB_POOL_PRE_PING`| `true`                                                    | Verify connections before use (`SELECT 1`)    |
| `DB_CONNECT_TIMEOUT` | `5`                                                    | Seconds to establish a connection (psycopg)   |
| `JWT_SECRET_KEY` | `arcana-insecure-development-secret-change-me-now`      | HMAC secret for signing access tokens (dev placeholder) |
| `JWT_ALGORITHM` | `HS256`                                                  | JWT signing algorithm (constrained on verify) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15`                                       | Access-token lifetime                         |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | `14`                                       | Refresh-session lifetime                      |
| `PASSWORD_MIN_LENGTH` | `8`                                                 | Minimum password length                       |
| `ARCANA_TEST_DATABASE_URL` | *(unset)*                                        | Dedicated test DB for integration tests       |
| `CORS_ORIGINS`   | `http://localhost:5173,http://localhost:4173`              | Comma-separated allowed browser origins       |

Secrets are never hardcoded, and `.env` is git-ignored.

## Running locally

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

- API root: <http://localhost:8000>
- Liveness: <http://localhost:8000/health> and <http://localhost:8000/api/v1/health>
- Readiness (checks the database): <http://localhost:8000/health/ready> and <http://localhost:8000/api/v1/health/ready>
- OpenAPI docs: <http://localhost:8000/docs>

## Authentication

### Endpoints

| Method | Path                   | Description                                        | Auth   |
| ------ | ---------------------- | -------------------------------------------------- | ------ |
| POST   | `/api/v1/auth/register`| Create an account; returns access + refresh tokens | —      |
| POST   | `/api/v1/auth/login`   | Verify credentials; returns access + refresh tokens| —      |
| POST   | `/api/v1/auth/refresh` | Rotate a refresh token into a new credential pair  | —      |
| POST   | `/api/v1/auth/logout`  | Revoke the refresh session (204)                   | —      |
| GET    | `/api/v1/auth/me`      | Return the authenticated user                      | Bearer |

### Architecture

- **Passwords** are hashed with **Argon2id** (argon2-cffi) and never stored in
  plaintext; hashes are never returned by the API or logged.
- **Access tokens** are short-lived signed JWTs (HS256 by default), carrying
  `sub`, `iat`, `exp`, `jti`, and a `type` claim. The accepted algorithm is
  constrained on verification (`alg=none` and header-driven algorithms are
  rejected). No sensitive personal/business data is embedded.
- **Refresh sessions** are server-side rows (`auth_sessions`) storing only the
  SHA-256 digest of an opaque refresh token. Refreshing **rotates** the
  credential: the old session is revoked and a new one is issued atomically,
  with replay protection. Logout revokes the session server-side.
- **The current-user dependency** (`get_current_user`) resolves the bearer token
  → user → active-check, and is reusable by future endpoints.

### Password policy

Minimum length of `PASSWORD_MIN_LENGTH` (default 8). No arbitrary composition
rules — the goal is secure authentication without unnecessary UX friction.

### Email identity

Emails are normalized (trimmed + lowercased) at the service boundary, and
case-insensitive uniqueness is enforced by the database via a functional unique
index on `lower(email)` — not by application code alone.

### Security notes

- Tokens are returned in JSON (`token_type: "bearer"`); the transport's security
  relies on HTTPS in deployment. This keeps the API suitable for the future
  ARCANA frontend without coupling to cookies yet.
- Login failures use one generic message to avoid account enumeration.
- Registration issues tokens immediately (one round-trip to enter ARCANA).
- **Not yet implemented** (future security phases): rate limiting on auth
  endpoints, email verification, password reset, and MFA.

## Running tests

```bash
cd backend
source .venv/bin/activate
pytest
```

Unit tests use FastAPI's `TestClient` against an in-memory SQLite database —
they do not require a running server or PostgreSQL. (SQLite is a test-only
facility; production always uses PostgreSQL.)

Integration tests (`pytest -m integration`) exercise a live PostgreSQL instance
via a **dedicated test database**. Set `ARCANA_TEST_DATABASE_URL` to a
disposable test database (never the development/production URL — the test
fixture refuses unsafe targets), then:

```bash
ARCANA_TEST_DATABASE_URL=postgresql+psycopg://arcana:arcana@localhost:5432/arcana_test \
  pytest -m integration
```

Without `ARCANA_TEST_DATABASE_URL`, integration tests skip automatically.

## Database

### Local PostgreSQL

Install PostgreSQL 14+, then create the database and user matching
`.env.example` (or set `DATABASE_URL` to your own instance):

```sql
CREATE USER arcana WITH PASSWORD 'arcana';
CREATE DATABASE arcana OWNER arcana;
```

### Docker PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

This starts a PostgreSQL 16 service with a named volume and a healthcheck,
matching `.env.example` out of the box.

### Migrations

```bash
cd backend
source .venv/bin/activate

alembic upgrade head                          # apply all migrations
alembic current                               # show the current revision
alembic downgrade -1                          # roll back one step
alembic revision --autogenerate -m "message"  # generate a new migration
```

- The database URL in `alembic/env.py` is resolved from application settings —
  connectivity has a single source of truth.
- Autogenerated migrations **must be manually reviewed** before they are
  applied; never run destructive changes (drops, data loss) without review.
- There are intentionally no migration files yet: no application tables exist,
  so a baseline migration would be empty noise. The first real migration is
  created together with the first domain model in a later phase.

### Testing

See [Running tests](#running-tests). Integration tests verify the real
connection, session lifecycle, migrations, and the full
register → login → refresh → logout flow against a live **test** database.
The test fixture refuses to run against the development database.

### Conventions

- **IDs** — every entity uses an application-generated UUID v4 primary key
  (`sqlalchemy.Uuid` → PostgreSQL `UUID`), via the `UUIDPkMixin` in
  `app/db/mixins.py`. Do not mix integer primary keys into the schema.
- **Timestamps** — stored as timezone-aware `TIMESTAMP WITH TIME ZONE` in UTC,
  via `TimestampMixin` (`created_at` / `updated_at`, database-side defaults).
  Serialize as ISO-8601 UTC strings; never persist naive datetimes.
- **Naming** — `app/db/base.py` defines a metadata naming convention, so every
  unnamed primary key, foreign key, unique constraint, check constraint and
  index gets a deterministic name (e.g. `pk_accounts`,
  `fk_missions_project_id_projects`). Name check constraints explicitly.
- **Transactions** — the database layer does not scatter commits. Services use
  `session_scope()` (commit on success, rollback on error, always close) for
  atomic multi-operation boundaries; the `get_db` request dependency rolls back
  on error and always closes, and never auto-commits.
- **Model discovery** — every model lives in `app/models/` and is imported from
  `app/models/__init__.py`, so Alembic autogenerate always sees it via
  `Base.metadata`. Keep those imports explicit.
- **Migrations** — always review autogenerated migrations; Alembic compares
  types and server defaults and respects the naming convention.

## Code quality

```bash
ruff check .
ruff format --check .
```

## Architecture principles

- **Separation of concerns** — API, schemas, services, repositories, models,
  configuration, logging and dependencies are kept apart.
- **The backend is the authority** — permissions, XP and game-state decisions
  will be made server-side; the frontend is never trusted for them.
- **Domain-driven** — future domains (Identity, Organization, Projects,
  Missions, Scrum, Gamification, World, Intelligence, Analytics, ...) slot into
  the existing `api/v1`, `models`, `schemas`, `services`, and `repositories`
  packages rather than requiring restructures.
