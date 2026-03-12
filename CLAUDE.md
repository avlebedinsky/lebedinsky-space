# CLAUDE.md — lebedinsky.space

## Что это

Личная стартовая страница: дашборд сервисов. Монорепо с Go API и React SPA.

## Стек

- **Frontend:** React 19, React Router 7, Tailwind CSS v4, Vite 7, TypeScript 5 (strict)
- **Backend:** Go 1.26, chi v5, pgx v5 (raw SQL, без ORM)
- **DB:** PostgreSQL 17
- **Deploy:** Docker Compose + Traefik + Authelia

## Структура монорепо

```
apps/web/        — React SPA
apps/api/        — Go API
  cmd/seed/      — утилита для начального заполнения БД
deploy/          — docker-compose.yml для prod (GHCR-образы)
docker-compose.yml — dev compose (локальная сборка + DB)
```

Вся конфигурация фронтенда живёт в `apps/web/`. В корне репозитория её нет.

## Dev-команды

```bash
# Фронтенд (http://localhost:5173, /api → :8080)
cd apps/web && npm run dev

# Или из корня монорепо
npm run dev:web
npm run build:web
npm run lint:web

# Бэкенд
cd apps/api
DATABASE_URL="postgres://postgres:secret@localhost:5432/lebedinsky" \
  PORT=8080 ENVIRONMENT=development ADMIN_GROUP=admins \
  go run .

# Тесты бэкенда (нужен Docker — testcontainers поднимает реальный Postgres)
cd apps/api && go test ./...

# TypeScript-проверка фронтенда
cd apps/web && npx tsc --noEmit

# Засеять БД тестовыми данными
cd apps/api && go run ./cmd/seed
```

## Аутентификация

- **prod:** Traefik + Authelia инжектируют `Remote-User` и `Remote-Groups`
- **dev:** API принимает `X-Dev-User: username` как fallback
- **dev-frontend:** Vite автоматически инжектирует `X-Dev-User: avleb` и `Remote-Groups: admin` в проксируемые запросы (настроено в `vite.config.ts`)
- `ADMIN_GROUP` задаёт имя группы для admin (по умолчанию `admins`)

## API endpoints

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/me` | все | текущий пользователь |
| GET | `/services` | все | список сервисов |
| POST/PUT/DELETE | `/services[/{id}]` | admin | управление сервисами |
| GET | `/status` | все | статусы сервисов (кэш 30с) |
| GET | `/metrics` | все | метрики сервера (CPU, RAM, диск, hostname) |

## Виджеты и карточки дашборда

На главной странице — три виджета + карточки сервисов в едином grid, все элементы перетаскиваются (`@dnd-kit/core` + `@dnd-kit/sortable`). Порядок сохраняется в `settings.gridOrder` через API.

- **ClockWidget** — текущее время (24ч, AM/PM, UTC AM/PM) и дата. Только фронтенд, `setInterval(1000)`.
- **WeatherWidget** — температура и описание погоды. Использует `navigator.geolocation` + [open-meteo.com](https://open-meteo.com) (без API-ключа) + [bigdatacloud.net](https://www.bigdatacloud.net/geocoding-api/reverse-geocode) для названия города. Обновляется каждые 30 мин.
- **MetricsWidget** — CPU, RAM, диск в процентах + hostname сервера. Polling `/metrics` каждые 15 сек.

### Drag & Drop

- `SortableItem` оборачивает каждый элемент grid. Клик при drag блокируется через `useDndMonitor` + `onClickCapture`.
- `ServiceCard` использует `div` + `window.open` (не `<a>`), чтобы клик можно было надёжно заблокировать после drag.
- Поле `sortOrder` у сервисов **не редактируется** в форме — порядок управляется только drag & drop.

### Endpoint `/metrics`

Использует `github.com/shirou/gopsutil/v3`. В Docker для получения **хостовых** метрик (а не контейнерных) нужны:

```yaml
environment:
  HOST_PROC: /host/proc
  HOST_SYS: /host/sys
volumes:
  - /proc:/host/proc:ro
  - /sys:/host/sys:ro
```

Оба docker-compose файла (`docker-compose.yml` и `deploy/docker-compose.yml`) уже настроены.

## Ключевые архитектурные решения

- **Нет mock-базы в тестах** — тесты работают с реальным Postgres через testcontainers
- **Статусы сервисов** — HEAD-запросы к URL, кэш 30 сек, конкурентно через goroutines
- **Иконки** — строковое `iconName` хранится в БД, маппится в LucideIcon через `src/lib/icons.ts`
- **Погода** — браузерная геолокация + open-meteo.com, без API-ключей
- **Метрики** — gopsutil читает `/proc` хоста через volume mount в Docker
- **Темизация** — CSS-переменные (`--color-bg`, `--color-card`, `--color-accent`, `--color-border`) устанавливаются через `applyTheme()` из `src/lib/theme.ts`, настройки хранятся в БД и редактируются на странице `/settings`
- **ColorPicker** — переиспользуемый компонент `src/components/ColorPicker.tsx`: кликабельный свотч + hex-значение поверх скрытого нативного `input[type=color]`. Используется в `SettingsPage` и `AdminPage`

## Деплой

Traefik (внешняя сеть `traefik`) + Authelia middleware `authelia@docker`.
`/api/*` роутится на Go-контейнер, prefix стрипается middleware-ом Traefik.

```bash
cp .env.example .env   # заполнить DATABASE_URL, POSTGRES_PASSWORD, ADMIN_GROUP
docker compose up -d --build
```

CI/CD: GitHub Actions собирает образы → GHCR → SSH деплой на сервер через `deploy/docker-compose.yml`.

## Что НЕ нужно делать

- Не создавать файлы фронтенда в корне репозитория — только в `apps/web/`
- Не мокать базу данных в тестах
- Не коммитить автоматически, не пушить без явной просьбы
- Не добавлять поле `sortOrder` обратно в форму сервиса — порядок управляется drag & drop
- Не использовать `<a href>` в `ServiceCard` — используется `div` + `window.open`, это необходимо для корректной блокировки клика после drag
