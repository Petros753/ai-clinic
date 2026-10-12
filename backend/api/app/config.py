"""Настройки API из переменных окружения (см. backend/.env.example)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://clinic:clinic@localhost:5432/clinic"
    # Секрет для JWT (понадобится в пункте 2 — пользователи и роли).
    secret_key: str = "change-me"


settings = Settings()
