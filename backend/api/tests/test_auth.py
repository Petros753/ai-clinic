from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.deps import edit, module_router
from tests.conftest import PASSWORD, auth


def test_login_and_me(client, users):
    h = auth(client, "Artem")  # логин без учёта регистра
    me = client.get("/api/auth/me", headers=h).json()
    assert me["name"] == "Артём" and me["is_director"]
    assert me["permissions"] == {"dashboard": "edit", "sklad": "edit", "razgovory": "edit"}


def test_bad_login(client, users):
    assert client.post("/api/auth/login", json={"login": "artem", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/login", json={"login": "nobody", "password": PASSWORD}).status_code == 401


def test_no_or_bad_token(client, users):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


def test_only_director_manages_users(client, users):
    assert client.get("/api/users", headers=auth(client, "admin")).status_code == 403
    assert len(client.get("/api/users", headers=auth(client, "artem")).json()) == 3


def test_create_user_gets_role_defaults(client, users):
    h = auth(client, "artem")
    r = client.post("/api/users", headers=h, json={"login": "olga", "name": "Ольга", "role": "nurse", "password": "12345678"})
    assert r.status_code == 201 and r.json()["permissions"] == {"sklad": "edit"}
    assert client.post("/api/users", headers=h, json={"login": "olga", "name": "x", "password": "12345678"}).status_code == 409
    assert client.post("/api/auth/login", json={"login": "olga", "password": "12345678"}).status_code == 200


def test_director_sets_permissions(client, users):
    h = auth(client, "artem")
    uid = users["nurse"].id
    r = client.put(f"/api/users/{uid}/permissions", headers=h, json={"permissions": {"dashboard": "view"}})
    assert r.json()["permissions"] == {"dashboard": "view"}
    bad = client.put(f"/api/users/{uid}/permissions", headers=h, json={"permissions": {"kitchen": "edit"}})
    assert bad.status_code == 422


def test_password_change_and_disable_revoke_tokens(client, users):
    h = auth(client, "artem")
    nurse_h = auth(client, "nurse")
    uid = users["nurse"].id
    client.patch(f"/api/users/{uid}", headers=h, json={"password": "new-password"})
    assert client.get("/api/auth/me", headers=nurse_h).status_code == 401

    nurse_h = {"Authorization": "Bearer " + client.post("/api/auth/login", json={"login": "nurse", "password": "new-password"}).json()["token"]}
    client.patch(f"/api/users/{uid}", headers=h, json={"is_active": False})
    assert client.get("/api/auth/me", headers=nurse_h).status_code == 401
    assert client.post("/api/auth/login", json={"login": "nurse", "password": "new-password"}).status_code == 401


def test_director_cannot_lock_himself_out(client, users):
    h = auth(client, "artem")
    uid = users["director"].id
    assert client.patch(f"/api/users/{uid}", headers=h, json={"is_active": False}).status_code == 400
    assert client.patch(f"/api/users/{uid}", headers=h, json={"role": "admin"}).status_code == 400


def test_module_router_checks_levels(client, users):
    """Так будут устроены маршруты разделов: просмотр — view, изменения — edit."""
    router = module_router("sklad")
    router.get("/items")(lambda: ["ok"])
    router.post("/movements", dependencies=[edit("sklad")])(lambda: "ok")
    app = FastAPI()
    app.include_router(router)
    from app.main import app as main_app
    app.dependency_overrides = main_app.dependency_overrides
    c = TestClient(app)

    nurse, admin, director = auth(client, "nurse"), auth(client, "admin"), auth(client, "artem")
    assert c.get("/api/sklad/items", headers=nurse).status_code == 200
    assert c.post("/api/sklad/movements", headers=nurse).status_code == 403  # у неё только view
    assert c.get("/api/sklad/items", headers=admin).status_code == 403
    assert c.post("/api/sklad/movements", headers=director).status_code == 200
    assert c.get("/api/sklad/items").status_code == 401
