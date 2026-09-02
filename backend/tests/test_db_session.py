"""Session lifecycle tests (no database required; sessions are faked)."""

import pytest

from app.db import session as db_session
from app.db.session import get_db


class FakeSession:
    def __init__(self) -> None:
        self.events: list[str] = []

    def commit(self) -> None:
        self.events.append("commit")

    def rollback(self) -> None:
        self.events.append("rollback")

    def close(self) -> None:
        self.events.append("close")


@pytest.fixture
def fake_session_factory(monkeypatch):
    created: list[FakeSession] = []

    def factory() -> FakeSession:
        session = FakeSession()
        created.append(session)
        return session

    monkeypatch.setattr(db_session, "SessionLocal", factory)
    return created


def test_session_scope_commits_on_success(fake_session_factory) -> None:
    with db_session.session_scope() as session:
        assert isinstance(session, FakeSession)

    assert fake_session_factory[0].events == ["commit", "close"]


def test_session_scope_rolls_back_on_error(fake_session_factory) -> None:
    with pytest.raises(RuntimeError):
        with db_session.session_scope():
            raise RuntimeError("boom")

    events = fake_session_factory[0].events
    assert "rollback" in events
    assert "commit" not in events
    assert events[-1] == "close"


def test_get_db_closes_on_success(fake_session_factory) -> None:
    generator = get_db()
    next(generator)
    with pytest.raises(StopIteration):
        next(generator)

    assert "close" in fake_session_factory[0].events


def test_get_db_rolls_back_and_closes_on_error(fake_session_factory) -> None:
    generator = get_db()
    next(generator)
    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("boom"))

    events = fake_session_factory[0].events
    assert "rollback" in events
    assert "close" in events
