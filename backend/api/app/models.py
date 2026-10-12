"""Таблицы базы. Новые модели импортируются в migrations/env.py через этот модуль."""
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, func
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


# ---------- Склад ----------


class Category(Base):
    __tablename__ = "stock_categories"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    color: Mapped[str] = mapped_column(String(16))
    sort: Mapped[int] = mapped_column(default=0)


class Supplier(Base):
    __tablename__ = "stock_suppliers"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    contact: Mapped[str] = mapped_column(String(255), default="")
    lead_days: Mapped[int] = mapped_column(default=3)


class Item(Base):
    """Позиция номенклатуры. stock меняется только операциями (StockOperation)."""

    __tablename__ = "stock_items"
    __table_args__ = (CheckConstraint("stock >= 0", name="stock_not_negative"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    barcode: Mapped[str] = mapped_column(String(32), unique=True)
    sku: Mapped[str] = mapped_column(String(64), default="")
    name: Mapped[str] = mapped_column(String(255))
    brand: Mapped[str] = mapped_column(String(128), default="")
    category_id: Mapped[str] = mapped_column(ForeignKey("stock_categories.id"))
    unit: Mapped[str] = mapped_column(String(8), default="уп")
    pack: Mapped[str] = mapped_column(String(64), default="")
    min: Mapped[int] = mapped_column(default=1)
    max: Mapped[int] = mapped_column(default=5)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    supplier_id: Mapped[str | None] = mapped_column(ForeignKey("stock_suppliers.id"))
    location: Mapped[str] = mapped_column(String(128), default="")
    expiry: Mapped[date | None]
    stock: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class StockOperation(Base):
    """Одна проведённая операция (скан-сессия, выдача из карточки, команда бота).

    idempotency_key задаёт клиент: повтор того же запроса (обрыв сети, очередь)
    не проводится второй раз, а возвращает уже сохранённый результат.
    """

    __tablename__ = "stock_operations"

    id: Mapped[int] = mapped_column(primary_key=True)
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)
    type: Mapped[str] = mapped_column(String(16))  # in | out | writeoff | adjust
    source: Mapped[str] = mapped_column(String(16))  # scanner | manual | bot
    # Кто провёл в системе (по входу) и кто физически выдал/принял (по выбору на экране или в боте).
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    performer: Mapped[str] = mapped_column(String(128))
    room: Mapped[str | None] = mapped_column(String(128))
    note: Mapped[str | None] = mapped_column(String(255))
    # default на стороне Python: время нужно сразу в ответе, без перечитывания строки.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), server_default=func.now(), index=True
    )

    lines: Mapped[list["StockMovement"]] = relationship(
        back_populates="operation", cascade="all, delete-orphan", lazy="selectin"
    )


class StockMovement(Base):
    """Строка операции: позиция и изменение остатка со знаком."""

    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(primary_key=True)
    operation_id: Mapped[int] = mapped_column(ForeignKey("stock_operations.id", ondelete="CASCADE"), index=True)
    item_id: Mapped[str] = mapped_column(ForeignKey("stock_items.id"), index=True)
    delta: Mapped[int]

    operation: Mapped[StockOperation] = relationship(back_populates="lines")
