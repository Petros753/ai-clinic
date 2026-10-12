"""Команды обслуживания. Запуск в Docker:

    docker compose exec api python -m app.cli create-director artem "Артём"
    docker compose exec api python -m app.cli set-password artem
    docker compose exec api python -m app.cli seed-sklad-demo
"""
import argparse
import getpass
import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.models import User
from app.security import hash_password


def _ask_password() -> str:
    while True:
        pwd = getpass.getpass("Пароль (от 8 символов): ")
        if len(pwd) < 8:
            print("Слишком короткий.")
        elif pwd != getpass.getpass("Ещё раз: "):
            print("Не совпадают.")
        else:
            return pwd


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("create-director", help="первый вход: создать директора")
    p.add_argument("login")
    p.add_argument("name")
    p = sub.add_parser("set-password", help="сменить пароль, если забыли")
    p.add_argument("login")
    sub.add_parser("seed-sklad-demo", help="загрузить демо-номенклатуру склада в пустую базу")
    args = parser.parse_args()

    if args.cmd == "seed-sklad-demo":
        from app.stock_demo import seed

        with SessionLocal() as db:
            director = db.scalar(select(User).where(User.role == "director").order_by(User.id))
            if not director:
                sys.exit("Сначала создайте директора: create-director")
            print(f"Загружено позиций: {seed(db, director)}")
        return

    login = args.login.strip().lower()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.login == login))
        if args.cmd == "create-director":
            if user:
                sys.exit(f"Логин {login} уже занят")
            db.add(User(login=login, name=args.name, role="director", password_hash=hash_password(_ask_password())))
        else:
            if not user:
                sys.exit(f"Нет сотрудника {login}")
            user.password_hash = hash_password(_ask_password())
            user.token_version += 1
        db.commit()
    print("Готово.")


if __name__ == "__main__":
    main()
