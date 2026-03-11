# lebedinsky.space

Личная стартовая страница с дашбордом сервисов, заметками и управлением через веб.

## Стек

| Слой | Технология |
|------|-----------|
| Фронтенд | React 19 + TypeScript + Tailwind CSS v4 + Vite |
| Бэкенд | Go (chi router) + PostgreSQL (pgx) |
| Аутентификация | Authelia (forward auth via Traefik) |
| Деплой | Docker Compose + Traefik |

## Структура

```
lebedinsky-space/
├── apps/
│   ├── web/          # React SPA
│   │   ├── src/
│   │   │   ├── lib/          # api client, типы, иконки
│   │   │   ├── hooks/        # useMe, useServices, useNotes, useStatus
│   │   │   ├── components/   # ServiceCard, NotesPanel, StatusDot
│   │   │   └── pages/        # AdminPage
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── api/          # Go API
│       ├── internal/
│       │   ├── handlers/     # services, notes, status, me
│       │   ├── middleware/   # auth (Remote-User header)
│       │   ├── models/
│       │   ├── db/           # migrations
│       │   └── config/
│       ├── cmd/seed/         # утилита засева БД
│       └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## API

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/me` | все | текущий пользователь |
| GET | `/services` | все | список сервисов |
| POST | `/services` | admin | создать сервис |
| PUT | `/services/{id}` | admin | обновить сервис |
| DELETE | `/services/{id}` | admin | удалить сервис |
| GET | `/status` | все | статусы сервисов (HEAD-запросы, кэш 30 сек) |
| GET | `/notes` | авторизован | заметки текущего пользователя |
| POST | `/notes` | авторизован | создать заметку |
| PUT | `/notes/{id}` | авторизован | обновить заметку |
| DELETE | `/notes/{id}` | авторизован | удалить заметку |

## Локальная разработка

**Бэкенд:**
```bash
# Запустить Postgres
docker run -d --name pg -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=lebedinsky -p 5432:5432 postgres:17-alpine

# Запустить API
cd apps/api
DATABASE_URL="postgres://postgres:secret@localhost:5432/lebedinsky" \
  PORT=8080 ENVIRONMENT=development ADMIN_GROUP=admins \
  go run .
```

**Фронтенд:**
```bash
cd apps/web
npm install
npm run dev   # http://localhost:5173
              # /api проксируется на :8080
```

Dev-аутентификация: API принимает заголовок `X-Dev-User: username` вместо `Remote-User`.

## Деплой

Предполагает Traefik с Authelia как middleware `authelia@docker` и внешнюю сеть `traefik`.

```bash
cp .env.example .env
# Заполнить DATABASE_URL, POSTGRES_PASSWORD, ADMIN_GROUP
docker compose up -d --build
```

Traefik автоматически получает SSL-сертификат и проксирует:
- `lebedinsky.space` → контейнер `web` (nginx + React SPA)
- `lebedinsky.space/api/*` → контейнер `api` (Go, `/api` prefix стрипается)
