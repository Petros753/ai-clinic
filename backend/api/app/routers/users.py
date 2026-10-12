"""Сотрудники и их права. Всё — только для директора."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_director
from app.models import Permission, User
from app.modules import DEFAULT_PERMISSIONS
from app.schemas import PermissionsIn, UserCreate, UserOut, UserUpdate
from app.security import hash_password

router = APIRouter(prefix="/api/users", tags=["users"], dependencies=[Depends(require_director)])


def _get(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    return user


def _set_permissions(user: User, permissions: dict[str, str]) -> None:
    user.permissions = [Permission(module=m, level=lvl) for m, lvl in permissions.items()]


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[UserOut]:
    return [UserOut.of(u) for u in db.scalars(select(User).order_by(User.id))]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    login = body.login.lower()
    if db.scalar(select(User).where(User.login == login)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Такой логин уже есть")
    user = User(login=login, name=body.name.strip(), role=body.role, password_hash=hash_password(body.password))
    _set_permissions(user, body.permissions if body.permissions is not None else DEFAULT_PERMISSIONS[body.role])
    db.add(user)
    db.commit()
    return UserOut.of(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, body: UserUpdate, db: Session = Depends(get_db), me: User = Depends(require_director)
) -> UserOut:
    user = _get(db, user_id)
    if user.id == me.id and (body.is_active is False or (body.role and body.role != "director")):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нельзя отключить себя или снять с себя роль директора")
    if body.name is not None:
        user.name = body.name.strip()
    if body.role is not None:
        user.role = body.role
    if body.password is not None:
        user.password_hash = hash_password(body.password)
        user.token_version += 1
    if body.is_active is not None and body.is_active != user.is_active:
        user.is_active = body.is_active
        user.token_version += 1
    db.commit()
    return UserOut.of(user)


@router.put("/{user_id}/permissions", response_model=UserOut)
def set_permissions(user_id: int, body: PermissionsIn, db: Session = Depends(get_db)) -> UserOut:
    user = _get(db, user_id)
    _set_permissions(user, body.permissions)
    db.commit()
    db.refresh(user)
    return UserOut.of(user)
