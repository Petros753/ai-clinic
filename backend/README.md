# Бэкенд AI Clinic

FastAPI + Postgres, всё поднимается одним `docker compose`.

```
backend/
  docker-compose.yml   db (Postgres) + api (FastAPI) + web (nginx со сборкой фронтенда)
  .env.example         пароли и секреты — скопировать в .env
  api/
    app/main.py        точка входа, все маршруты под /api
    app/config.py      настройки из переменных окружения
    app/db.py          подключение к базе, Base для моделей, get_db
    app/models.py      таблицы: users, permissions
    app/modules.py     разделы (dashboard, sklad, razgovory), уровни view/edit, права по ролям
    app/security.py    пароли (argon2) и токены входа (JWT)
    app/deps.py        проверка входа и прав: get_current_user, require_director, module_router
    app/routers/       /api/auth (вход), /api/users (сотрудники и права, только директор)
    app/cli.py         создать директора, сменить пароль
    migrations/        миграции Alembic (накатываются при старте контейнера api)
    tests/             pytest на SQLite, Postgres не нужен
  web/
    Dockerfile         собирает frontend/ и кладёт в nginx
    nginx.conf         статика + прокси /api → api:8000
```

## Запуск в Docker (локально или на VPS)

```bash
cd backend
cp .env.example .env      # поменять POSTGRES_PASSWORD, вписать SECRET_KEY (openssl rand -hex 32)
docker compose up -d --build
curl localhost:8080/api/health   # {"status":"ok","db":"ok"}
docker compose exec api python -m app.cli create-director artem "Артём"   # спросит пароль
```

Дальше вход на сайте под `artem`, остальных сотрудников директор заводит в «Сотрудники» (кнопка в верхней панели). Забыли пароль: `docker compose exec api python -m app.cli set-password artem`.

Сайт — http://localhost:8080, документация API — http://localhost:8080/api/docs.

Контейнер `web` слушает только `127.0.0.1:8080`: на VPS снаружи стоит системный nginx с HTTPS, он проксирует домен на этот порт:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Разработка без Docker

Postgres можно поднять только его: `docker compose up -d db` (тогда добавьте `ports: ["127.0.0.1:5432:5432"]` к `db`) или взять локальный.

```bash
cd backend/api
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://clinic:ПАРОЛЬ@localhost:5432/clinic
alembic upgrade head
python -m app.cli create-director artem "Артём"
uvicorn app.main:app --reload     # http://localhost:8000/api/health
```

Без `SECRET_KEY` API возьмёт случайный ключ (входы сбрасываются при перезапуске), это нормально для разработки.

Фронтенд в режиме `npm run dev` сам проксирует `/api` на `localhost:8000` (`frontend/vite.config.ts`) и показывает экран входа.

## Вход и права

- `POST /api/auth/login` `{login, password}` → `{token, user}`; дальше заголовок `Authorization: Bearer <token>`. Токен живёт `TOKEN_HOURS` (14 ч).
- `GET /api/auth/me` — кто вошёл и его права `{"sklad": "edit", ...}`.
- `/api/users` — список, создание, `PATCH` (имя, роль, пароль, отключить), `PUT /{id}/permissions`. Только директор.
- Права: таблица `permissions (user_id, module, level)`, уровни `view` (смотреть) и `edit` (проводить операции). Директор (`role = director`) видит всё без записей в таблице. Новому сотруднику права ставятся по роли: администратор — «Разговоры», старшая медсестра — «Склад».
- Смена пароля и отключение сотрудника сразу гасят его старые входы (`token_version`).

**Права проверяются на каждом маршруте.** Маршруты раздела собирать так:

```python
from app.deps import edit, module_router

router = module_router("sklad")                         # любой маршрут — нужен view

@router.get("/items")
def items(): ...

@router.post("/movements", dependencies=[edit("sklad")])  # изменения — нужен edit
def add_movement(): ...
```

Тест `tests/test_routes_protected.py` падает, если в API появится маршрут без проверки входа (открыты только `/api/health` и `/api/auth/login`).

## Тесты

```bash
cd backend/api
pip install -r requirements-dev.txt
pytest
```

## Миграции

Модели наследуются от `app.db.Base`. После изменения моделей:

```bash
alembic revision --autogenerate -m "что поменялось"
alembic upgrade head
```

Новые модели кладите в `app/models.py` (его импортирует `migrations/env.py`), иначе autogenerate их не увидит.
