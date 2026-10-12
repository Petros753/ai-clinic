"""Точка входа API. Все маршруты живут под /api — nginx проксирует их сюда."""
from fastapi import APIRouter, Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db

app = FastAPI(title="AI Clinic API", docs_url="/api/docs", openapi_url="/api/openapi.json")
api = APIRouter(prefix="/api")


@api.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    """Проверка, что API живо и видит базу."""
    db.execute(text("select 1"))
    return {"status": "ok", "db": "ok"}


app.include_router(api)
