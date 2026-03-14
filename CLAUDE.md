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
| GET | `/metrics` | все | метрики сервера (CPU, RAM, диск, uptime, network I/O, hostname) |
| GET | `/docker` | все | список Docker-контейнеров |
| GET | `/rss/feeds` | все | список RSS-лент |
| POST | `/rss/feeds` | admin | добавить RSS-ленту |
| DELETE | `/rss/feeds/{id}` | admin | удалить RSS-ленту |
| GET | `/rss/items` | все | получить элементы всех лент (кэш) |

## Виджеты и карточки дашборда

На главной странице — виджеты + карточки сервисов в едином grid, все элементы перетаскиваются (`@dnd-kit/core` + `@dnd-kit/sortable`). Порядок сохраняется в `settings.gridOrder` через API.

- **ClockWidget** — текущее время (24ч, AM/PM, UTC AM/PM) и дата. Только фронтенд, `setInterval(1000)`.
- **WeatherWidget** — температура и описание погоды. Использует `navigator.geolocation` + [open-meteo.com](https://open-meteo.com) (без API-ключа) + [bigdatacloud.net](https://www.bigdatacloud.net/geocoding-api/reverse-geocode) для названия города. Обновляется каждые 30 мин. Данные кэшируются в `localStorage` (`weather_cache`) — при перезагрузке страницы виджет показывает последние данные мгновенно, минуя стадию `loading`. При ошибке обновления ошибка не показывается, если есть кэшированные данные.
- **MetricsWidget** — CPU, RAM, диск в процентах + hostname сервера. Polling `/metrics` каждые 15 сек.
- **NetworkWidget** — аптайм сервера (из `/metrics`) и скорость сети (входящий/исходящий трафик в KB/s или MB/s). Polling `/metrics` каждые 15 сек.
- **DockerWidget** — список Docker-контейнеров с индикатором состояния (running/exited). Polling `/docker` каждые 30 сек. Если Docker недоступен — показывает пустой список.

Виджеты можно скрывать через AdminPage (секция «Виджеты»). Список скрытых виджетов хранится в `settings.hiddenWidgets` (JSON-массив строк в БД). Доступные ID: `clock`, `weather`, `metrics`, `network`, `docker`.

### Drag & Drop

- `SortableItem` оборачивает каждый элемент grid. Клик при drag блокируется через `useDndMonitor` + `onClickCapture`.
- `ServiceCard` использует `div` + `window.open` (не `<a>`), чтобы клик можно было надёжно заблокировать после drag.
- Поле `sortOrder` у сервисов **не редактируется** в форме — порядок управляется только drag & drop.
- **На мобильных** (touch-устройства, `pointer: coarse`) DnD отключён — grid рендерится напрямую без `DndContext`/`SortableContext`. Определяется через `window.matchMedia('(pointer: coarse)')` в `App.tsx`.

### Endpoint `/metrics`

Использует `github.com/shirou/gopsutil/v3`. Возвращает: `cpu`, `ram`, `disk` (%), `hostname`, `uptime` (секунды), `netIn`/`netOut` (байты total с момента запуска ОС).

В Docker для получения **хостовых** метрик (а не контейнерных) нужны:

```yaml
environment:
  HOST_PROC: /host/proc
  HOST_SYS: /host/sys
volumes:
  - /proc:/host/proc:ro
  - /sys:/host/sys:ro
```

Оба docker-compose файла (`docker-compose.yml` и `deploy/docker-compose.yml`) уже настроены.

### Endpoint `/docker`

Подключается к Docker daemon через Unix-сокет (`/var/run/docker.sock`) или TCP. Управляется переменной `DOCKER_HOST`:
- не задана / `unix:///var/run/docker.sock` → сокет по умолчанию
- `tcp://localhost:2375` → TCP (нужно для Docker Desktop на Windows/Mac — включить "Expose daemon on tcp://localhost:2375")

Если Docker недоступен — возвращает пустой массив `[]`, не ошибку.

### RSS-ленты

Модели: `RSSFeed` (id, url, title, createdAt) и `RSSFeedWithItems`. Элементы лент кэшируются в памяти. Обработчик `RSSHandler` создаётся с зависимостью от пула DB (`handlers.NewRSSHandler(pool)`).

Dev `docker-compose.yml` пробрасывает порт `5432:5432` наружу, чтобы бэкенд и `go test` могли обращаться к Postgres напрямую (без Docker-сети).

## Ключевые архитектурные решения

- **Нет mock-базы в тестах** — тесты работают с реальным Postgres через testcontainers
- **Статусы сервисов** — HEAD-запросы к URL, кэш 30 сек, конкурентно через goroutines
- **Иконки** — строковое `iconName` хранится в БД, маппится в LucideIcon через `src/lib/icons.ts`
- **Погода** — браузерная геолокация + open-meteo.com, без API-ключей; кэш в `localStorage` (`weather_cache`) для мгновенного отображения при перезагрузке
- **Метрики** — gopsutil читает `/proc` хоста через volume mount в Docker
- **Скрытие сервисов** — поле `hidden` (boolean) в таблице `services`; скрытые сервисы не отображаются на дашборде, управляются через AdminPage
- **Скрытие виджетов** — поле `hidden_widgets` (JSON-массив) в `site_settings`; управляется через AdminPage (секция Виджеты), хранится в `settings.hiddenWidgets`
- **Темизация** — CSS-переменные (`--color-bg`, `--color-card`, `--color-accent`, `--color-border`) устанавливаются через `applyTheme()` из `src/lib/theme.ts`, настройки хранятся в БД и редактируются на странице `/settings`. Дефолтный `borderColor` — `#1f2937` (серый Tailwind gray-800, не полупрозрачный белый)
- **ColorPicker** — переиспользуемый компонент `src/components/ColorPicker.tsx`: кликабельный свотч + hex-значение поверх скрытого нативного `input[type=color]`. Используется в `SettingsPage` и `AdminPage`
- **AdminPage** — разделён на секции: `ServicesSection`, `WidgetsSection`, `RSSSection` (файлы в `src/pages/admin/`)

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
- Не экспортировать константы и типы из файлов с React-компонентами — ESLint-правило `react-refresh/only-export-components` запрещает mixed exports. Выносить в отдельный файл (пример: `serviceFormTypes.ts`)
