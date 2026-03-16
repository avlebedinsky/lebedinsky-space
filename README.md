# lebedinsky.space

Персональная стартовая страница с виджетами, карточками сервисов, RSS и базой знаний.

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 19, React Router 7, TypeScript 5 (strict), Tailwind CSS v4, Vite 7 |
| Backend | Go 1.26, chi v5, pgx v5 (raw SQL) |
| DB | PostgreSQL 17 |
| Auth | Traefik + Authelia (prod), `X-Dev-User` (dev fallback) |
| Deploy | Docker Compose + Traefik |

## Что умеет

- Единый grid с drag and drop для карточек сервисов и виджетов.
- Виджеты: часы, погода, метрики, сеть, Docker, настроение, pixel pet.
- RSS-ленты с настройкой видимости и лимита элементов на ленту.
- База знаний из GitHub-репозитория с markdown-рендерингом.
- Персональные настройки на пользователя: тема, порядок grid, скрытые элементы, размеры карточек/виджетов, настройки базы знаний.

## Структура репозитория

```text
apps/web/        React SPA
apps/api/        Go API
apps/api/cmd/seed/  утилита начального заполнения БД
deploy/          production docker-compose (GHCR images)
docker-compose.yml  локальный compose
```

## API

| Метод | Путь | Доступ | Описание |
|------|------|--------|----------|
| GET | `/me` | все | текущий пользователь |
| GET | `/services` | все | список сервисов пользователя |
| POST | `/services` | admin | создать сервис |
| PUT | `/services/{id}` | admin | обновить сервис |
| DELETE | `/services/{id}` | admin | удалить сервис |
| GET | `/status` | все | статусы сервисов (кэш 30с) |
| GET | `/metrics` | все | CPU/RAM/disk/uptime/network/hostname |
| GET | `/docker` | все | список контейнеров Docker |
| GET | `/settings` | все | настройки интерфейса и базы знаний пользователя |
| PUT | `/settings` | admin | обновить настройки пользователя |
| GET | `/rss/feeds` | все | список RSS-лент пользователя |
| POST | `/rss/feeds` | admin | добавить RSS-ленту |
| PUT | `/rss/feeds/{id}` | admin | обновить RSS-ленту |
| DELETE | `/rss/feeds/{id}` | admin | удалить RSS-ленту |
| GET | `/rss/items` | все | получить элементы всех видимых лент (кэш) |
| GET | `/knowledge/tree` | все | дерево markdown-файлов из GitHub-репозитория |
| GET | `/knowledge/file?path=...` | все | содержимое markdown-файла |
| GET | `/mood` | все | список mood-записей пользователя |
| POST | `/mood` | все | создать mood-запись |
| DELETE | `/mood/{id}` | все | удалить mood-запись |

## Локальная разработка

### 1. Зависимости

```bash
npm install
```

### 2. Запуск frontend

```bash
cd apps/web
npm run dev
```

Frontend доступен на `http://localhost:5173`, запросы `/api` проксируются на API.

### 3. Запуск backend

```bash
cd apps/api
DATABASE_URL="postgres://postgres:secret@localhost:5432/lebedinsky" \
  PORT=8080 ENVIRONMENT=development ADMIN_GROUP=admins \
  go run .
```

### 4. Postgres для dev

```bash
docker run -d --name pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=lebedinsky \
  -p 5432:5432 postgres:17-alpine
```

Или через compose-сервис `db`.

## Полезные команды

```bash
# Из корня
npm run dev:web
npm run build:web
npm run lint:web

# Backend tests (используют testcontainers)
cd apps/api && go test ./...

# TypeScript check
cd apps/web && npx tsc --noEmit

# Seed
cd apps/api && go run ./cmd/seed
```

## Аутентификация

- Production: ожидаются заголовки `Remote-User` и `Remote-Groups` от Traefik/Authelia.
- Development: API принимает `X-Dev-User` как fallback.
- Vite proxy в dev добавляет `X-Dev-User: avleb` и `Remote-Groups: admin`.

## Деплой

Требуется внешняя сеть `traefik` и middleware `authelia@docker`.

```bash
cp .env.example .env
docker compose up -d --build
```

Заполни в `.env`: `DATABASE_URL`, `POSTGRES_PASSWORD`, `ADMIN_GROUP`.
