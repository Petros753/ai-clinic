"""Пароли (argon2) и токены входа (JWT)."""
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from app.config import settings

_hasher = PasswordHasher()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


# Чтобы вход с несуществующим логином шёл столько же, сколько с неверным паролем.
DUMMY_HASH = hash_password("dummy-password")


def create_token(user_id: int, token_version: int) -> str:
    now = datetime.now(UTC)
    payload = {"sub": str(user_id), "tv": token_version, "iat": now, "exp": now + timedelta(hours=settings.token_hours)}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM], options={"require": ["sub", "exp"]})
    except jwt.PyJWTError:
        return None
