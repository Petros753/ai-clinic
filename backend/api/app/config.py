"""Настройки API из переменных окружения (см. backend/.env.example)."""
import secrets
import warnings

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://clinic:clinic@localhost:5432/clinic"
    # Секрет для подписи JWT: openssl rand -hex 32. Кто его знает — может войти кем угодно.
    secret_key: str = ""
    # Сколько живёт вход: смена с запасом, потом вход заново.
    token_hours: int = 14

    @field_validator("secret_key")
    @classmethod
    def strong_secret(cls, v: str) -> str:
        if not v:
            # Разработка без .env: случайный ключ, входы сбрасываются при перезапуске.
            warnings.warn("SECRET_KEY не задан — взят случайный, только для разработки", stacklevel=2)
            return secrets.token_hex(32)
        if len(v) < 32:
            raise ValueError("SECRET_KEY слишком короткий: сгенерируйте openssl rand -hex 32")
        return v


settings = Settings()
