import pytest

from app.models import Category, Item, Supplier
from tests.conftest import auth

GLOVES = "4601000000017"
ANEST = "4602000000014"


@pytest.fixture
def stock(db, users):
    db.add_all([
        Category(id="ppe", name="СИЗ", color="#000", sort=1),
        Supplier(id="med", name="МедСнаб", contact="", lead_days=1),
    ])
    db.add_all([
        Item(id="i1", barcode=GLOVES, name="Перчатки M", category_id="ppe", supplier_id="med", min=3, max=10, price=690, stock=5),
        Item(id="i2", barcode=ANEST, name="Ультракаин", category_id="ppe", min=1, max=5, price=4890, stock=1),
    ])
    db.commit()


def move(client, h, type_="out", items=((GLOVES, 1),), key="key-00000001", **kw):
    body = {"type": type_, "items": [{"barcode": b, "qty": q} for b, q in items], "idempotency_key": key, **kw}
    return client.post("/api/stock/movements", headers=h, json=body)


def stock_of(client, h):
    return {i["id"]: i["stock"] for i in client.get("/api/stock/items", headers=h).json()}


def test_permissions(client, stock):
    nurse, admin = auth(client, "nurse"), auth(client, "admin")  # медсестра — только просмотр склада
    assert client.get("/api/stock/items", headers=nurse).status_code == 200
    assert client.get("/api/stock/items", headers=admin).status_code == 403
    assert client.get("/api/stock/items").status_code == 401
    assert move(client, nurse).status_code == 403
    assert client.post("/api/stock/items", headers=nurse, json={"barcode": "1234", "name": "x", "categoryId": "ppe"}).status_code == 403


def test_server_counts_stock(client, stock):
    h = auth(client, "artem")
    r = move(client, h, "out", [(GLOVES, 2), (ANEST, 1)], room="Кабинет 14", user="Анна К.", source="scanner")
    assert r.status_code == 200, r.text
    body = r.json()
    assert {i["id"]: i["stock"] for i in body["items"]} == {"i1": 3, "i2": 0}
    assert {(a["itemId"], a["level"]) for a in body["alerts"]} == {("i2", "out")}
    assert {m["user"] for m in body["movements"]} == {"Анна К."}
    move(client, h, "in", [(GLOVES, 4)], key="key-00000002")
    move(client, h, "adjust", [(ANEST, 2)], key="key-00000003")
    assert stock_of(client, h) == {"i1": 7, "i2": 2}
    journal = client.get("/api/stock/movements", headers=h).json()
    assert [m["type"] for m in journal][:2] == ["adjust", "in"] and len(journal) == 4


def test_same_scan_twice_merges(client, stock):
    h = auth(client, "artem")
    move(client, h, "out", [(GLOVES, 1), (GLOVES, 1)])
    assert stock_of(client, h)["i1"] == 3


def test_idempotency_key_prevents_double_writeoff(client, stock):
    h = auth(client, "artem")
    first = move(client, h, "writeoff", [(GLOVES, 2)], key="retry-key-1").json()
    again = move(client, h, "writeoff", [(GLOVES, 2)], key="retry-key-1").json()
    assert not first["duplicate"] and again["duplicate"]
    assert again["movements"][0]["id"] == first["movements"][0]["id"]
    assert stock_of(client, h)["i1"] == 3
    assert len(client.get("/api/stock/movements", headers=h).json()) == 1


def test_not_enough_stock_rolls_back_whole_operation(client, stock):
    h = auth(client, "artem")
    r = move(client, h, "out", [(GLOVES, 1), (ANEST, 5)])
    assert r.status_code == 409 and "Ультракаин" in r.json()["detail"]
    assert stock_of(client, h) == {"i1": 5, "i2": 1}
    # тот же ключ после ошибки можно провести исправленным
    assert move(client, h, "out", [(GLOVES, 1)]).status_code == 200


def test_validation(client, stock):
    h = auth(client, "artem")
    assert move(client, h, "out", [("999999", 1)]).status_code == 422
    assert move(client, h, "out", [(GLOVES, 0)]).status_code == 422
    assert move(client, h, "out", [(GLOVES, -1)]).status_code == 422
    assert move(client, h, "out", [(GLOVES, 1)], key="short").status_code == 422


def test_items_create_and_recount(client, stock):
    h = auth(client, "artem")
    new = {"barcode": "4609999999999", "name": "Маски", "categoryId": "ppe", "min": 2, "max": 8, "price": 240, "stock": 6}
    r = client.post("/api/stock/items", headers=h, json=new)
    assert r.status_code == 201 and r.json()["stock"] == 6
    iid = r.json()["id"]
    assert client.post("/api/stock/items", headers=h, json=new).status_code == 409
    r = client.patch(f"/api/stock/items/{iid}", headers=h, json={**new, "name": "Маски 3-сл.", "stock": 4})
    assert r.json()["name"] == "Маски 3-сл." and r.json()["stock"] == 4
    types = [m["type"] for m in client.get("/api/stock/movements", headers=h).json() if m["itemId"] == iid]
    assert types == ["adjust", "in"]


def test_catalog_and_staff(client, stock):
    h = auth(client, "nurse")
    cat = client.get("/api/stock/catalog", headers=h).json()
    assert cat["categories"][0]["id"] == "ppe" and cat["rooms"]
    names = {s["name"] for s in client.get("/api/stock/staff", headers=h).json()}
    assert names == {"Артём", "Медсестра"}  # у администратора нет доступа к складу
