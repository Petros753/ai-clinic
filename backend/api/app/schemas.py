"""Формы запросов и ответов API."""
from pydantic import BaseModel, ConfigDict, Field

from app.modules import Level, Module, Role

Login = Field(min_length=2, max_length=64, pattern=r"^[a-zA-Z0-9_.\-]+$")
Password = Field(min_length=8, max_length=128)
Name = Field(min_length=1, max_length=128)


class LoginIn(BaseModel):
    login: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login: str
    name: str
    role: str
    is_director: bool
    is_active: bool
    # Итоговые права: у директора — edit на всё.
    permissions: dict[str, str]

    @classmethod
    def of(cls, user) -> "UserOut":
        return cls(
            id=user.id, login=user.login, name=user.name, role=user.role,
            is_director=user.is_director, is_active=user.is_active, permissions=user.levels(),
        )


class TokenOut(BaseModel):
    token: str
    user: UserOut


class UserCreate(BaseModel):
    login: str = Login
    name: str = Name
    role: Role = "staff"
    password: str = Password
    # Не указаны — берутся права по умолчанию для роли.
    permissions: dict[Module, Level] | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    role: Role | None = None
    password: str | None = Field(None, min_length=8, max_length=128)
    is_active: bool | None = None


class PermissionsIn(BaseModel):
    # Полный набор прав сотрудника: раздел → уровень. Раздела нет в списке — доступа нет.
    permissions: dict[Module, Level]
