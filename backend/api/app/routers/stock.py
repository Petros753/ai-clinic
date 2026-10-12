"""API склада: /api/stock/... Чтение — право «Склад: просмотр», операции — «Склад: изменение».

Остатки считает сервер: клиент присылает только операции (что, сколько, куда),
а stock позиции меняется в той же транзакции, что и запись в журнал.
"""
import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Literal

from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import edit, get_current_user, module_router
from app.models import Category, Item, Permission, StockOperation, Supplier, User
from app.stock import ROOMS, Result, StockError, apply_operation, daily_use

router = module_router("sklad", prefix="/api/stock")

MoveType = Literal["in", "out", "writeoff", "adjust"]
Source = Literal["scanner", "manual", "bot"]


# ---------- формы ----------


class CategoryOut(BaseModel):
    id: str
    name: str
    color: str


class SupplierOut(BaseModel):
    id: str
    name: str
    contact: str
    leadDays: int


class CatalogOut(BaseModel):
    categories: list[CategoryOut]
    suppliers: list[SupplierOut]
    rooms: list[str]


class ItemOut(BaseModel):
    """Те же поля, что у Item во frontend/src/modules/inventory/types."""

    id: str
    barcode: str
    sku: str
    name: str
    brand: str
    categoryId: str
    unit: str
    pack: str
    stock: int
    min: int
    max: int
    price: float
    supplierId: str | None
    location: str
    expiry: date | None
    dailyUse: float


class ItemIn(BaseModel):
    barcode: str = Field(min_length=4, max_length=32, pattern=r"^[0-9A-Za-z\-]+$")
    sku: str = Field("", max_length=64)
    name: str = Field(min_length=1, max_length=255)
    brand: str = Field("", max_length=128)
    categoryId: str
    unit: str = Field("уп", max_length=8)
    pack: str = Field("", max_length=64)
    min: int = Field(1, ge=0)
    max: int = Field(5, ge=0)
    price: float = Field(0, ge=0)
    supplierId: str | None = None
    location: str = Field("", max_length=128)
    expiry: date | None = None
    # Новая позиция: начальный остаток (проводится приходом).
    # Правка: фактический остаток после пересчёта (проводится корректировкой на разницу).
    stock: int | None = Field(None, ge=0)


class MovementOut(BaseModel):
    """Строка журнала — как Movement во фронтенде."""

    id: str
    ts: datetime
    itemId: str
    type: MoveType
    qty: int
    user: str
    room: str | None
    note: str | None
    source: Source
    opKey: str


class Line(BaseModel):
    barcode: str = Field(min_length=1, max_length=32)
    qty: int


class MoveIn(BaseModel):
    type: MoveType
    items: list[Line] = Field(min_length=1, max_length=200)
    # Кто физически выдал / принял. Не указан — тот, кто вошёл.
    user: str | None = Field(None, max_length=128)
    room: str | None = Field(None, max_length=128)
    note: str | None = Field(None, max_length=255)
    source: Source = "manual"
    # Уникален для каждой операции; повтор с тем же ключом не проводится второй раз.
    idempotency_key: str = Field(min_length=8, max_length=64)

    @model_validator(mode="after")
    def check_qty(self):
        for ln in self.items:
            if self.type == "adjust" and ln.qty == 0 or self.type != "adjust" and ln.qty <= 0:
                raise ValueError("Количество должно быть больше нуля")
        return self


class AlertOut(BaseModel):
    itemId: str
    level: Literal["low", "out"]


class MoveOut(BaseModel):
    movements: list[MovementOut]
    items: list[ItemOut]
    alerts: list[AlertOut]
    # true — операция с этим ключом уже была проведена раньше, сейчас ничего не изменилось
    duplicate: bool


class StaffOut(BaseModel):
    id: int
    name: str
    role: str


# ---------- преобразования ----------


def item_out(i: Item, use: dict[str, float]) -> ItemOut:
    return ItemOut(
        id=i.id, barcode=i.barcode, sku=i.sku, name=i.name, brand=i.brand, categoryId=i.category_id,
        unit=i.unit, pack=i.pack, stock=i.stock, min=i.min, max=i.max, price=float(i.price),
        supplierId=i.supplier_id, location=i.location, expiry=i.expiry, dailyUse=use.get(i.id, 0.0),
    )


def movements_out(op: StockOperation) -> list[MovementOut]:
    return [
        MovementOut(
            id=f"m{ln.id}", ts=op.created_at, itemId=ln.item_id, type=op.type,
            qty=ln.delta if op.type == "adjust" else abs(ln.delta),
            user=op.performer, room=op.room, note=op.note, source=op.source, opKey=op.idempotency_key,
        )
        for ln in op.lines
    ]


def result_out(db: Session, r: Result) -> MoveOut:
    use = daily_use(db)
    return MoveOut(
        movements=movements_out(r.operation),
        items=[item_out(i, use) for i in r.items],
        alerts=[AlertOut(itemId=i.id, level=lvl) for i, lvl in r.alerts],
        duplicate=r.duplicate,
    )


def run(db: Session, **kw) -> Result:
    try:
        return apply_operation(db, **kw)
    except StockError as e:
        db.rollback()
        raise HTTPException(e.status, e.message) from None


def check_refs(db: Session, body: ItemIn) -> None:
    if not db.get(Category, body.categoryId):
        raise HTTPException(422, "Нет такой категории")
    if body.supplierId and not db.get(Supplier, body.supplierId):
        raise HTTPException(422, "Нет такого поставщика")
    if body.max < body.min:
        raise HTTPException(422, "Оптимальный остаток меньше минимального")


# ---------- маршруты ----------


@router.get("/catalog", response_model=CatalogOut)
def catalog(db: Session = Depends(get_db)) -> CatalogOut:
    return CatalogOut(
        categories=[CategoryOut(id=c.id, name=c.name, color=c.color) for c in db.scalars(select(Category).order_by(Category.sort))],
        suppliers=[SupplierOut(id=s.id, name=s.name, contact=s.contact, leadDays=s.lead_days) for s in db.scalars(select(Supplier).order_by(Supplier.name))],
        rooms=ROOMS,
    )


@router.get("/items", response_model=list[ItemOut])
def list_items(db: Session = Depends(get_db)) -> list[ItemOut]:
    use = daily_use(db)
    return [item_out(i, use) for i in db.scalars(select(Item).order_by(Item.name))]


@router.post("/items", response_model=ItemOut, status_code=201, dependencies=[edit("sklad")])
def create_item(body: ItemIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ItemOut:
    check_refs(db, body)
    if db.scalar(select(Item).where(Item.barcode == body.barcode)):
        raise HTTPException(409, "Этот штрихкод уже привязан к другой позиции")
    data = body.model_dump(exclude={"stock", "categoryId", "supplierId"})
    item = Item(id=f"i{uuid.uuid4().hex[:10]}", category_id=body.categoryId, supplier_id=body.supplierId, stock=0, **data)
    db.add(item)
    db.commit()
    if body.stock:
        run(db, user=user, type_="in", lines=[(item, body.stock)], idempotency_key=f"init-{item.id}",
            source="manual", note="Начальный остаток")
    db.refresh(item)
    return item_out(item, daily_use(db))


@router.patch("/items/{item_id}", response_model=ItemOut, dependencies=[edit("sklad")])
def update_item(item_id: str, body: ItemIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ItemOut:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(404, "Позиция не найдена")
    check_refs(db, body)
    if db.scalar(select(Item).where(Item.barcode == body.barcode, Item.id != item_id)):
        raise HTTPException(409, "Этот штрихкод уже привязан к другой позиции")
    for k, v in body.model_dump(exclude={"stock", "categoryId", "supplierId"}).items():
        setattr(item, k, v)
    item.category_id, item.supplier_id = body.categoryId, body.supplierId
    db.commit()
    if body.stock is not None and body.stock != item.stock:
        run(db, user=user, type_="adjust", lines=[(item, body.stock - item.stock)],
            idempotency_key=f"adj-{uuid.uuid4().hex}", source="manual", note="Пересчёт остатка")
        db.refresh(item)
    return item_out(item, daily_use(db))


@router.get("/movements", response_model=list[MovementOut])
def list_movements(days: int = Query(60, ge=1, le=366), db: Session = Depends(get_db)) -> list[MovementOut]:
    since = datetime.now(UTC) - timedelta(days=days)
    ops = db.scalars(
        select(StockOperation).where(StockOperation.created_at >= since).order_by(StockOperation.created_at.desc(), StockOperation.id.desc())
    )
    return [m for op in ops for m in movements_out(op)]


@router.post("/movements", response_model=MoveOut, dependencies=[edit("sklad")])
def create_movement(body: MoveIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> MoveOut:
    r = run(
        db, user=user, type_=body.type, lines=[(ln.barcode, ln.qty) for ln in body.items],
        idempotency_key=body.idempotency_key, source=body.source, performer=body.user, room=body.room, note=body.note,
    )
    return result_out(db, r)


@router.get("/staff", response_model=list[StaffOut])
def staff(db: Session = Depends(get_db)) -> list[StaffOut]:
    """Кого можно выбрать в «Выдаёт / Принимает»: активные сотрудники с доступом к складу."""
    users = db.scalars(
        select(User).where(User.is_active, (User.role == "director") | User.permissions.any(Permission.module == "sklad")).order_by(User.name)
    )
    return [StaffOut(id=u.id, name=u.name, role=u.role) for u in users]
