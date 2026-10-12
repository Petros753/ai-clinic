"""Таблицы базы. Новые модели импортируются в migrations/env.py через этот модуль."""
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(128))
    # director | admin | nurse | staff. Доступ решает is_director и таблица permissions,
    # роль — подпись и права по умолчанию для нового сотрудника.
    role: Mapped[str] = mapped_column(String(32), default="staff")
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    # Растёт при смене пароля и отключении — старые токены перестают работать.
    token_version: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    permissions: Mapped[list["Permission"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def is_director(self) -> bool:
        return self.role == "director"

    def level(self, module: str) -> str | None:
        """Уровень доступа к разделу: директору всё, остальным — из permissions."""
        if self.is_director:
            return "edit"
        return next((p.level for p in self.permissions if p.module == module), None)

    def levels(self) -> dict[str, str]:
        from app.modules import MODULES

        return {m: lvl for m in MODULES if (lvl := self.level(m))}


class Permission(Base):
    __tablename__ = "permissions"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    module: Mapped[str] = mapped_column(String(32), primary_key=True)
    level: Mapped[str] = mapped_column(String(16))  # view | edit

    user: Mapped[User] = relationship(back_populates="permissions")
