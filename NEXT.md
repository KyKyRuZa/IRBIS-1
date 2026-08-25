# IRBIS ППЦ — Напутствие для следующего агента

## Что это
Учёт спецодежды/СИЗ/расходников для АЗС. Бэкенд: Node.js/Express + PostgreSQL 17. Фронтенд: React 18 + Vite. Докер: compose с postgres, backend, frontend.

## Запуск
```bash
docker compose up --build
```
- Фронт: http://localhost:5173
- Бэк: http://localhost:5000
- БД: postgres/postgres

## Стек
- Бэк: express, prisma (+@prisma/client, схема в prisma/schema.prisma), pg (адаптер), jsonwebtoken, bcrypt, cors, zod, docx, docxtemplater, exceljs, archiver, node-cron, web-push, multer, adm-zip, pino
- Фронт: react, react-router-dom v6, axios, vite, vitest, testing-library
- Докер: postgres:17-alpine, node:24-alpine (backend, `NODE_ENV=production`), node:24-alpine (frontend, vite dev на :5173). `client/nginx.conf` существует, но в compose-образе клиента не используется (отдаётся dev-сервер vite, не nginx).

## Структура
```
server/
  src/
    index.js              # точка входа, подключает все роуты
    models/db.js          # Prisma-клиент + pg-совместимый пул-шим (pool.query); initDB() только подключается. Схема — prisma/schema.prisma, миграции — prisma/migrations
    models/*Model.js      # CRUD
    controllers/*.js      # бизнес-логика
    routes/*.js           # Express роуты
    middleware/auth.js     # cookiesMiddleware (парсинг кук), authMiddleware, adminOnly
    middleware/upload.js   # multer middleware для загрузки файлов
    controllers/adminController.js  # справки, уведомления, backup
    controllers/authController.js   # login/register/changePassword/refresh/logout/me
    utils/tokens.js                 # генерация access/refresh токенов, опции кук, хэш refresh в БД
    controllers/pushController.js   # push-подписки, отправка уведомлений
    controllers/uploadController.js # загрузка сертификатов и подписей
    controllers/employeeController.js # CRUD сотрудников
    controllers/issueRecordController.js # CRUD выдач
    controllers/certificateController.js # CRUD сертификатов
    controllers/exportController.js # экспорт Word/Excel
    controllers/reportController.js # отчёты Word/Excel
    services/notificationService.js # агрегация уведомлений в таблицу
    templates/             # .docx шаблоны
    scripts/
      seed.js              # сидинг БД (11 сотрудников, 13 позиций, 14 сертификатов, 143 выдачи, 312 норм, 3 формы)
      verify-docs.js       # проверка генерации документов
  tests/
    api.test.js            # интеграционные тесты API (10 тестов)
client/
  src/
    main.jsx              # createRoot, BrowserRouter
    App.jsx               # роуты, ProtectedRoute, навигация, page themes
    lib/api.js            # axios-инстанс (withCredentials + auto-refresh при 401) + downloadBlob()
    pages/*.jsx           # страницы
    index.css             # глобальные стили + page themes
    __tests__/            # фронтенд-тесты (vitest)
    hooks/
      usePushNotifications.js # подписка на push
  public/
    logo.webp       # логотип
    sw.js                  # Service Worker
```

## Важно
- **Роутер**: `BrowserRouter` только в `main.jsx`. В `App.jsx` его быть не должно — двойной роутер ломает рендер.
- **Аутентификация**: `access_token` (JWT, 15m) и `refresh_token` (7d) выпускаются на `POST /api/auth/login` и хранятся в **httpOnly-cookie** (`Path=/api`, `SameSite=Strict`; `secure` зависит от `NODE_ENV`/`COOKIE_SECURE`). Клиент НЕ читает токен из JS. `access_token` читается в `middleware/auth.js` из `req.cookies.access_token` (fallback на `Authorization: Bearer` оставлен для скриптов/тестов). Сессия восстанавливается `GET /api/auth/me`, продлевается `POST /api/auth/refresh` (rotation + revoke старого в БД), сбрасывается `POST /api/auth/logout`. `refresh_token` хэшируется (sha256) и сохраняется в таблице `refresh_tokens`.
- **Админские эндпоинты** (`/api/admin/*`, `/api/reports/*`, `/api/export/*`) требуют `adminOnly`. В `client/src/lib/api.js` axios-инстанс с `withCredentials=true` (куки уходят автоматически) + response-interceptor для авто-refresh при 401. Ручной `Authorization` больше не ставится.
- **Схема БД** управляется Prisma. Новые поля/таблицы — править `prisma/schema.prisma` и создавать миграцию (`npx prisma migrate dev`), затем `npx prisma migrate deploy` на целевой БД. `initDB()` больше не создаёт таблицы.
- **Групповая выдача**: `POST /api/issues/batch` принимает `site_id, item_type_id, quantity, ...`.
- **Возврат СИЗ**: `PATCH /api/issues/:id/return` с телом `{ return_date, return_quantity }`.
- **Списание**: `PATCH /api/issues/:id/dispose`.
- **Увольнение**: `PATCH /api/employees/:id/terminate`.
- **Потребность**: `GET /api/admin/demand` + `GET /api/reports/demand/excel`.
- **Уведомления**: `GET /api/admin/notifications`.
- **Резервная копия**: `GET /api/admin/backup` (pg_dump).
- **Формы**: таблицы `forms` и `form_taken` создаются Prisma-миграцией (см. `prisma/schema.prisma`). Роут `/api/forms` работает.
- **Push-уведомления**: таблица `push_subscriptions` создаётся Prisma-миграцией. Роуты `/api/push/*` работают. Service Worker: `client/public/sw.js`. Хук `usePushNotifications` используется в `Header.jsx` (переключатель в меню профиля).
- **Загрузка файлов**: реализована через `multer`. Эндпоинты `POST /api/upload/certificate` и `POST /api/upload/signature`. Файлы сохраняются в `/app/uploads` (certificates/ и signatures/). Статика доступна через `/uploads/*`.
- **Сидинг**: `node src/scripts/seed.js` из папки `server/`. Очищает все таблицы и заполняет демо-данными. Создаёт админ-пользователя `admin`/`admin` (если его нет).
- **Верификация документов**: `node src/scripts/verify-docs.js` из папки `server/`. Проверяет все эндпоинты экспорта и сохраняет файлы в `server/src/tmp/`.

## Известные проблемы / TODO
- **TODO (регресс миграции токенов)**: Серверный `Dockerfile` ставит `ENV NODE_ENV=production`, из-за чего httpOnly-cookie помечаются флагом `Secure` (см. `server/src/utils/tokens.js`). При этом фронт в `docker-compose` раздаётся по HTTP (vite dev на `:5173`), поэтому браузер не отправляет `Secure`-куки и авторизация в `docker compose up --build` не работает. Исправление (выбрать одно): выставить `COOKIE_SECURE=false` для compose-окружения, отдавать фронт по HTTPS через `nginx.conf`, либо не ставить `NODE_ENV=production` на сервере в dev-сборке.
- **Исправлено**: `wear_time_override_months` не сохранялся при выдаче — было `wearTimeOverride`, стало `wear_time_override`.
- **Исправлено**: В `EmployeeList.jsx` добавлено `height` в `formData` — убрано React-предупреждение.
- **Исправлено**: Админские кнопки («Уволить» и др.) скрыты для не-админов в UI.
- **Исправлено**: Добавлены `authMiddleware + adminOnly` на `exportRoutes` и `reportRoutes`.
- **Исправлено**: В `reportController.js` отсутствовал импорт `docx` и вспомогательные функции для генерации Word-отчётов. Теперь отчёты генерируются корректно.
- **Исправлено**: В `exportController.js` в `exportConsumables` добавлены `employee_name` и `personnel_number` в data для шаблона.
- **Исправлено**: В `Reports.jsx` все запросы к `/api/admin/*` и `/api/reports/*` идут через axios-инстанс из `lib/api.js` (`withCredentials`), экспорты — через `downloadBlob()`. Авторизация передаётся httpOnly-cookie, не заголовком.
- **Исправлено**: Шапка сайта сделана белой, добавлен логотип `logo.webp`.
- **Добавлено**: Page-specific темизация для всех 11 страниц через CSS-переменные `.page-*`.
- **Добавлено**: Класс `.action-buttons` для выравнивания кнопок «Карточка»/«Уволить» в таблице сотрудников.
- **Добавлено**: Фронтенд-тесты на vitest + testing-library (`client/src/__tests__/`).
- **Добавлено**: Бэкенд-тесты на node:test (`server/tests/api.test.js`) — 10 тестов, покрывают auth и wear_time_override.
- **Seed**: создаёт 11 сотрудников (включая 1 уволенного), 13 позиций, 14 сертификатов (active + 1 expired), 143 выдачи (разные статусы), 312 норм, 3 формы, 5 push-подписок, админ-пользователя.
- **Авторизация**: токены (`access_token`, `refresh_token`) выпускаются на `/api/auth/login` и хранятся в httpOnly-cookie (`Path=/api`, `SameSite=Strict`). Клиент не читает токен из JS — сессия восстанавливается через `GET /api/auth/me`, продлевается через `POST /api/auth/refresh`, сбрасывается через `POST /api/auth/logout`. `refresh_token` хэшируется и сохраняется в БД (`refresh_tokens`). Тестовый доступ: admin/admin.

## Что уже сделано по ТЗ
✅ Групповая выдача
✅ Ручная корректировка срока носки
✅ reorder_date
✅ Подпись сотрудника (поля signature_path/signature_date)
✅ Фильтры в отчётах
✅ Сводная «Потребность»
✅ Уведомления
✅ Увольнение (кнопка)
✅ Списание (кнопка)
✅ Возврат СИЗ (кнопка)
✅ Групповая ведомость расходников (Word)
✅ Аутентификация/роли (admin/user)
✅ Резервное копирование
✅ forms/form_taken таблицы
✅ Page-specific темизация
✅ Логотип
✅ Авторизация на всех админских/экспортных роутах
✅ Сидинг БД
✅ Проверка заполняемости документов
