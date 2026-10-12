"""Склад: проведение операций и расчёт остатков. Используют роутер, CLI и (позже) Telegram-бот."""
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Item, StockMovement, StockOperation, User

# Кабинеты, куда выдают расходники (совпадают с планом клиники в дашборде).
ROOMS = ["Кабинет 14", "Малая операционная", "Предоперационная", "Постоперационная", "Рентген"]

# За сколько дней считаем средний расход в день.
USE_WINDOW_DAYS = 28


class StockError(Exception):
    """Операцию провести нельзя; status — HTTP-код для API."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def level(stock: int, min_: int) -> str:
    return "out" if stock <= 0 else "low" if stock < min_ else "ok"


@dataclass
class Result:
    operation: StockOperation
    items: list[Item]
    # Позиции, которые этой операцией впервые ушли ниже минимума или в ноль: [(item, "low"|"out")]
    alerts: list[tuple[Item, str]]
    duplicate: bool


def signed(type_: str, qty: int) -> int:
    """Изменение остатка: приход +, расход и списание −, корректировка — со своим знаком."""
    return qty if type_ in ("in", "adjust") else -qty


def apply_operation(
    db: Session,
    *,
    user: User,
    type_: str,
    lines: list[tuple[Item | str, int]],
    idempotency_key: str,
    source: str,
    performer: str | None = None,
    room: str | None = None,
    note: str | None = None,
) -> Result:
    """Проводит операцию целиком или никак. lines — (позиция или штрихкод, количество).

    Остаток меняется под блокировкой строк позиций, поэтому два одновременных
    списания одной позиции не уйдут в минус. Повтор с тем же idempotency_key
    возвращает первую операцию и ничего не меняет.
    """
    existing = db.scalar(select(StockOperation).where(StockOperation.idempotency_key == idempotency_key))
    if existing:
        return _replay(db, existing)

    # Сводим одинаковые позиции (два скана одной коробки в списке = одна строка).
    qty_by_key: dict[str, int] = {}
    for ref, qty in lines:
        key = ref.id if isinstance(ref, Item) else ref.strip()
        qty_by_key[key] = qty_by_key.get(key, 0) + qty
    by_id = isinstance(lines[0][0], Item) if lines else False
    col = Item.id if by_id else Item.barcode

    # Блокируем позиции в одном порядке — без взаимных блокировок между параллельными запросами.
    items = list(db.scalars(select(Item).where(col.in_(qty_by_key)).order_by(Item.id).with_for_update()))
    found = {(i.id if by_id else i.barcode): i for i in items}
    unknown = [k for k in qty_by_key if k not in found]
    if unknown:
        raise StockError(422, f"Неизвестный штрихкод: {', '.join(unknown)}")

    alerts: list[tuple[Item, str]] = []
    op = StockOperation(
        idempotency_key=idempotency_key, type=type_, source=source, user_id=user.id,
        performer=(performer or user.name).strip()[:128], room=room, note=note,
    )
    for key, qty in qty_by_key.items():
        item = found[key]
        d = signed(type_, qty)
        if d == 0:
            continue
        if item.stock + d < 0:
            raise StockError(409, f"Недостаточно на складе: {item.name} (остаток {item.stock} {item.unit})")
        before = level(item.stock, item.min)
        item.stock += d
        after = level(item.stock, item.min)
        if after == "out" and before != "out":
            alerts.append((item, "out"))
        elif after == "low" and before == "ok":
            alerts.append((item, "low"))
        op.lines.append(StockMovement(item_id=item.id, delta=d))
    if not op.lines:
        raise StockError(422, "Пустая операция")

    db.add(op)
    try:
        db.commit()
    except IntegrityError:
        # Тот же ключ только что провёл параллельный запрос (двойное нажатие, повтор очереди).
        db.rollback()
        existing = db.scalar(select(StockOperation).where(StockOperation.idempotency_key == idempotency_key))
        if not existing:
            raise
        return _replay(db, existing)
    return Result(op, items, alerts, duplicate=False)


def _replay(db: Session, op: StockOperation) -> Result:
    ids = [ln.item_id for ln in op.lines]
    items = list(db.scalars(select(Item).where(Item.id.in_(ids))))
    return Result(op, items, [], duplicate=True)


def daily_use(db: Session) -> dict[str, float]:
    """Средний расход в день по позициям за последние USE_WINDOW_DAYS дней."""
    since = datetime.now(UTC) - timedelta(days=USE_WINDOW_DAYS)
    rows = db.execute(
        select(StockMovement.item_id, func.sum(-StockMovement.delta))
        .join(StockOperation)
        .where(StockOperation.type == "out", StockOperation.created_at >= since)
        .group_by(StockMovement.item_id)
    )
    return {item_id: round(float(total) / USE_WINDOW_DAYS, 3) for item_id, total in rows}
