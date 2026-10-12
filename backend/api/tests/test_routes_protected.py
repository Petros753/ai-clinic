"""Страховка: каждый маршрут API проверяет вход. Новый маршрут без проверки уронит этот тест.

Смотрим в схему OpenAPI: у маршрута с get_current_user в зависимостях там есть `security`
(его добавляет HTTPBearer). Так не зависим от внутреннего устройства роутеров FastAPI.
"""
from app.main import app

PUBLIC = {("get", "/api/health"), ("post", "/api/auth/login")}


def test_every_api_route_requires_login():
    ops = {
        (method, path): op
        for path, methods in app.openapi()["paths"].items()
        for method, op in methods.items()
    }
    assert PUBLIC <= ops.keys()
    assert len(ops) > len(PUBLIC)
    open_ops = {k for k, op in ops.items() if k not in PUBLIC and not op.get("security")}
    assert not open_ops, f"Маршруты без проверки входа: {open_ops}"
