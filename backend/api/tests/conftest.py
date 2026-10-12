"""Тесты гоняются на SQLite в памяти — Postgres для них не нужен.

Запуск: cd backend/api && pip install -r requirements-dev.txt && pytest
"""
import os

os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import Permission, User
from app.security import hash_password

PASSWORD = "secret-pass"


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(engine, expire_on_commit=False)

    def override():
        with Session() as s:
            yield s

    app.dependency_overrides[get_db] = override
    with Session() as s:
        yield s
    app.dependency_overrides.clear()


@pytest.fixture
def client(db):
    return TestClient(app)


@pytest.fixture
def users(db):
    """Директор, администратор (только «Разговоры») и старшая медсестра (только «Склад»)."""
    director = User(login="artem", name="Артём", role="director", password_hash=hash_password(PASSWORD))
    admin = User(login="admin", name="Администратор", role="admin", password_hash=hash_password(PASSWORD),
                 permissions=[Permission(module="razgovory", level="edit")])
    nurse = User(login="nurse", name="Медсестра", role="nurse", password_hash=hash_password(PASSWORD),
                 permissions=[Permission(module="sklad", level="view")])
    db.add_all([director, admin, nurse])
    db.commit()
    return {"director": director, "admin": admin, "nurse": nurse}


def auth(client, login):
    r = client.post("/api/auth/login", json={"login": login, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}
