"""Зависимости FastAPI для проверки входа и прав.

Правило: у каждого маршрута /api (кроме входа и /api/health) должна быть одна из них —
это проверяет tests/test_routes_protected.py. Скрыть вкладку на фронте недостаточно.

Маршруты раздела удобно собирать так:

    router = module_router("sklad", prefix="/api/stock")      # чтение: нужен view
    @router.post("/movements", dependencies=[edit("sklad")])  # запись: нужен edit
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.modules import Level, Module, level_allows
from app.security import decode_token

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED, "Нужно войти", headers={"WWW-Authenticate": "Bearer"}
    )
    payload = decode_token(creds.credentials) if creds else None
    if not payload:
        raise unauthorized
    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active or payload.get("tv") != user.token_version:
        raise unauthorized
    return user


def require_director(user: User = Depends(get_current_user)) -> User:
    if not user.is_director:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Только для директора")
    return user


def require_module(module: Module, level: Level = "view"):
    def check(user: User = Depends(get_current_user)) -> User:
        if not level_allows(user.level(module), level):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Нет доступа к разделу")
        return user

    return check


def edit(module: Module):
    """Для dependencies=[...] у маршрутов, которые что-то меняют."""
    return Depends(require_module(module, "edit"))


def module_router(module: Module, prefix: str | None = None) -> APIRouter:
    """Роутер раздела (по умолчанию /api/<module>): каждый маршрут требует хотя бы просмотра."""
    return APIRouter(
        prefix=prefix or f"/api/{module}", tags=[module], dependencies=[Depends(require_module(module, "view"))]
    )
