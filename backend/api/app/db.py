"""Подключение к Postgres: движок, сессии, базовый класс моделей."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Все модели наследуются отсюда — Alembic берёт схему из Base.metadata."""


def get_db() -> Iterator[Session]:
    """Зависимость FastAPI: одна сессия на запрос."""
    with SessionLocal() as session:
        yield session
