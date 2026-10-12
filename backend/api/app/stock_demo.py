"""Демо-номенклатура склада (та же, что в демо-версии фронтенда) для проверки на пустой базе.

    docker compose exec api python -m app.cli seed-sklad-demo
"""
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Item, Supplier, User
from app.stock import apply_operation

SUPPLIERS = [
    ("dent", "Денталика", "+7 (8512) 00-00-01 · zakaz@dentalika.demo", 2),
    ("stom", "СтомаДепо", "+7 (8512) 00-00-02 · opt@stomadepo.demo", 3),
    ("med", "МедСнаб Юг", "+7 (8512) 00-00-03 · sales@medsnab.demo", 1),
]

# id, код (без префикса 460 и контрольной цифры), артикул, название, производитель, категория,
# ед., фасовка, остаток, мин, опт, цена, поставщик, место, годен ещё дней
ITEMS = [
    ('i01', '100000001', 'PPE-GLV-M', 'Перчатки нитриловые, M', 'Benovy', 'ppe', 'уп', '100 шт', 3, 6, 20, 690, 'med', 'Шкаф А · полка 1', 540),
    ('i02', '100000002', 'PPE-GLV-S', 'Перчатки нитриловые, S', 'Benovy', 'ppe', 'уп', '100 шт', 9, 4, 14, 690, 'med', 'Шкаф А · полка 1', 610),
    ('i03', '100000003', 'PPE-MSK-3', 'Маски трёхслойные', 'Aviora', 'ppe', 'уп', '50 шт', 12, 4, 16, 240, 'med', 'Шкаф А · полка 2', 900),
    ('i04', '100000004', 'PPE-CAP', 'Шапочки-берет', 'Aviora', 'ppe', 'уп', '100 шт', 5, 2, 8, 310, 'med', 'Шкаф А · полка 2', None),
    ('i05', '100000005', 'PPE-BIB', 'Нагрудники двухслойные', 'Kerr', 'ppe', 'уп', '500 шт', 2, 1, 4, 1450, 'stom', 'Шкаф А · полка 3', None),
    ('i06', '200000006', 'AN-ULT-DSF', 'Ультракаин Д-С форте 1,7 мл', 'Sanofi', 'anest', 'уп', '100 карпул', 1, 2, 5, 4890, 'dent', 'Сейф · полка 1', 210),
    ('i07', '200000007', 'AN-SEPT', 'Септанест 1:100 000', 'Septodont', 'anest', 'уп', '50 карпул', 3, 2, 5, 2950, 'dent', 'Сейф · полка 1', 24),
    ('i08', '200000008', 'AN-NDL-30G', 'Иглы карпульные 30G 0,3×21', 'Septoject', 'anest', 'уп', '100 шт', 4, 2, 6, 1320, 'dent', 'Шкаф Б · полка 1', 730),
    ('i09', '200000009', 'AN-GEL', 'Гель аппликационный', 'Dentsply', 'anest', 'фл', '30 г', 2, 1, 3, 890, 'dent', 'Шкаф Б · полка 1', 12),
    ('i10', '300000010', 'FL-Z250-A2', 'Filtek Z250, A2', '3M', 'fill', 'шпр', '4 г', 6, 3, 10, 1780, 'stom', 'Шкаф Б · полка 2', 320),
    ('i11', '300000011', 'FL-Z250-A3', 'Filtek Z250, A3', '3M', 'fill', 'шпр', '4 г', 2, 3, 10, 1780, 'stom', 'Шкаф Б · полка 2', 300),
    ('i12', '300000012', 'FL-EST-A2', 'Estelite Sigma Quick, A2', 'Tokuyama', 'fill', 'шпр', '3,8 г', 4, 2, 6, 2150, 'stom', 'Шкаф Б · полка 2', 45),
    ('i13', '300000013', 'FL-SBU', 'Адгезив Single Bond Universal', '3M', 'fill', 'фл', '5 мл', 3, 1, 4, 5400, 'stom', 'Холодильник', 160),
    ('i14', '300000014', 'FL-ETCH', 'Протравка гель 37%', 'Vococid', 'fill', 'шпр', '2 мл', 7, 3, 10, 390, 'stom', 'Шкаф Б · полка 2', 400),
    ('i15', '300000015', 'FL-FUJI9', 'Fuji IX GP, стеклоиономер', 'GC', 'fill', 'наб', '15 г + 6,4 мл', 1, 1, 2, 6900, 'stom', 'Шкаф Б · полка 3', 260),
    ('i16', '400000016', 'EN-KF-15', 'K-файлы 25 мм, №15', 'Mani', 'endo', 'уп', '6 шт', 8, 3, 10, 520, 'dent', 'Шкаф В · полка 1', None),
    ('i17', '400000017', 'EN-PTG', 'ProTaper Gold, 25 мм', 'Dentsply', 'endo', 'уп', '6 шт', 0, 1, 4, 5200, 'dent', 'Шкаф В · полка 1', None),
    ('i18', '400000018', 'EN-NAOCL', 'Гипохлорит натрия 3%', 'Омега-Дент', 'endo', 'фл', '100 мл', 4, 2, 6, 210, 'dent', 'Шкаф В · полка 2', 180),
    ('i19', '400000019', 'EN-GP', 'Гуттаперчевые штифты 04', 'Meta', 'endo', 'уп', '60 шт', 3, 2, 5, 480, 'dent', 'Шкаф В · полка 2', 500),
    ('i20', '400000020', 'EN-AHP', 'AH Plus, силер', 'Dentsply', 'endo', 'наб', '2×4 мл', 1, 1, 2, 4300, 'dent', 'Шкаф В · полка 2', 75),
    ('i21', '500000021', 'ST-PKG-100', 'Крафт-пакеты 100×200', 'СтериТ', 'steril', 'уп', '100 шт', 6, 3, 10, 560, 'med', 'Предоперационная', 700),
    ('i22', '500000022', 'ST-IND', 'Индикаторы стерилизации 132°', 'Винар', 'steril', 'уп', '500 шт', 1, 1, 3, 980, 'med', 'Предоперационная', 20),
    ('i23', '500000023', 'ST-WIPE', 'Дезинфицирующие салфетки', 'Оптимакс', 'steril', 'уп', '120 шт', 2, 3, 8, 450, 'med', 'Предоперационная', 330),
    ('i24', '500000024', 'ST-CONC', 'Дезсредство концентрат 1 л', 'Лизоформин', 'steril', 'фл', '1 л', 5, 2, 6, 1150, 'med', 'Тех. помещение', 420),
    ('i25', '600000025', 'DS-SAL', 'Слюноотсосы', 'Latus', 'disp', 'уп', '100 шт', 4, 3, 10, 280, 'stom', 'Шкаф А · полка 3', None),
    ('i26', '600000026', 'DS-COT', 'Валики ватные №2', 'Celluron', 'disp', 'уп', '300 шт', 7, 2, 8, 350, 'stom', 'Шкаф А · полка 3', None),
    ('i27', '600000027', 'DS-BRUSH', 'Микробраши', 'Latus', 'disp', 'уп', '100 шт', 24, 3, 8, 260, 'stom', 'Шкаф Б · полка 3', None),
    ('i28', '600000028', 'DS-CUP', 'Стаканы одноразовые 200 мл', 'Latus', 'disp', 'уп', '100 шт', 5, 2, 8, 170, 'med', 'Тех. помещение', None),
    ('i29', '700000029', 'IM-ALG', 'Альгинатная масса', 'Zhermack', 'impr', 'уп', '453 г', 2, 1, 4, 890, 'stom', 'Шкаф В · полка 3', 250),
    ('i30', '700000030', 'IM-SIL-A', 'Силикон А-типа, лайт', 'Zhermack', 'impr', 'наб', '2×50 мл', 1, 1, 3, 3100, 'stom', 'Шкаф В · полка 3', 190),
]


def ean(body: str) -> str:
    """EAN-13 с контрольной цифрой, как в демо фронтенда (префикс 460 — Россия)."""
    d = ("460" + body)[:12].ljust(12, "0")
    s = sum(int(c) * (3 if i % 2 else 1) for i, c in enumerate(d))
    return d + str((10 - s % 10) % 10)


def seed(db: Session, user: User) -> int:
    """Заводит поставщиков и позиции, начальные остатки проводит одной операцией прихода."""
    if db.scalar(select(Item).limit(1)):
        raise SystemExit("На складе уже есть позиции — демо-данные не загружаю")
    for sid, name, contact, lead in SUPPLIERS:
        if not db.get(Supplier, sid):
            db.add(Supplier(id=sid, name=name, contact=contact, lead_days=lead))
    db.flush()  # поставщики раньше позиций: связи между моделями нет, порядок вставки задаём сами
    items = []
    for (iid, code, sku, name, brand, cat, unit, pack, stock, mn, mx, price, sup, loc, exp) in ITEMS:
        it = Item(id=iid, barcode=ean(code), sku=sku, name=name, brand=brand, category_id=cat, unit=unit, pack=pack,
                  min=mn, max=mx, price=price, supplier_id=sup, location=loc, stock=0,
                  expiry=date.today() + timedelta(days=exp) if exp is not None else None)
        db.add(it)
        items.append((it, stock))
    db.commit()
    apply_operation(db, user=user, type_="in", lines=[(it, q) for it, q in items if q > 0],
                    idempotency_key="demo-seed", source="manual", note="Начальные остатки (демо)")
    return len(items)
