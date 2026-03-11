# CLAUDE.md — lebedinsky.space

## Что это

Личная стартовая страница: дашборд сервисов + заметки. Монорепо с Go API и React SPA.

## Структура монорепо

```
apps/web/   — React SPA (единственный источник правды для фронтенда)
apps/api/   — Go API
```

Вся конфигурация фронтенда живёт в `apps/web/`. В корне репозитория её нет.

## Dev-команды

```bash
# Фронтенд (http://localhost:5173, /api проксируется на :8080)
cd apps/web && npm run dev

# Бэкенд
cd apps/api
DATABASE_URL="postgres://postgres:secret@localhost:5432/lebedinsky" \
  PORT=8080 ENVIRONMENT=development ADMIN_GROUP=admins \
  go run .

# Тесты бэкенда (нужен реальный Postgres, не мок)
cd apps/api && go test ./...

# TypeScript-проверка фронтенда
cd apps/web && npx tsc --noEmit
```

## Аутентификация

- В prod: Traefik + Authelia инжектируют заголовок `Remote-User` (и `Remote-Groups` для admin)
- В dev: API принимает `X-Dev-User: username` как fallback
- Группа для admin задаётся переменной `ADMIN_GROUP` (по умолчанию `admins`)

## Ключевые архитектурные решения

- **Нет mock-базы в тестах** — тесты бэкенда работают с реальным Postgres через testcontainers/pgx
- **Статусы сервисов** — HEAD-запросы к URL, кэш 30 сек, конкурентно через goroutines
- **Иконки** — строковое имя `iconName` хранится в БД, маппится в LucideIcon через `src/lib/icons.ts`
- **Заметки** — скоупятся по `username` из заголовка, admin видит только свои заметки

## Деплой

Traefik (внешняя сеть `traefik`) + Authelia middleware `authelia@docker`.
`/api/*` роутится на Go-контейнер, prefix стрипается middleware-ом Traefik.

```bash
cp .env.example .env   # заполнить DATABASE_URL, POSTGRES_PASSWORD, ADMIN_GROUP
docker compose up -d --build
```

## Что НЕ нужно делать

- Не создавать файлы фронтенда в корне репозитория — только в `apps/web/`
- Не мокать базу данных в тестах
- Не коммитить автоматически, не пушить без явной просьбы
