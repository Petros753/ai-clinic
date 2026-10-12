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
    migrations/        миграции Alembic (накатываются при старте контейнера api)
  web/
    Dockerfile         собирает frontend/ и кладёт в nginx
    nginx.conf         статика + прокси /api → api:8000
```

## Запуск в Docker (локально или на VPS)

```bash
cd backend
cp .env.example .env      # поменять POSTGRES_PASSWORD и SECRET_KEY
docker compose up -d --build
curl localhost:8080/api/health   # {"status":"ok","db":"ok"}
```

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
uvicorn app.main:app --reload     # http://localhost:8000/api/health
```

Фронтенд в режиме `npm run dev` сам проксирует `/api` на `localhost:8000` (`frontend/vite.config.ts`).

## Миграции

Модели наследуются от `app.db.Base`. После изменения моделей:

```bash
alembic revision --autogenerate -m "что поменялось"
alembic upgrade head
```

Новые модели нужно импортировать в `migrations/env.py` (или в модуль, который он импортирует), иначе autogenerate их не увидит.
