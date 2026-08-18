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
- Бэк: express, pg, bcrypt, docx, docxtemplater, exceljs, archiver, nodemon, node-cron, web-push, multer, adm-zip
- Фронт: react, react-router-dom v6, axios, vite, vitest, testing-library
- Докер: postgres:17-alpine, node:20-alpine, nginx:alpine

## Структура
```
server/
  src/
    index.js              # точка входа, подключает все роуты
    models/db.js          # пул + initDB() — создаёт все таблицы, делает ALTER TABLE
    models/*Model.js      # CRUD
    controllers/*.js      # бизнес-логика
    routes/*.js           # Express роуты
    middleware/auth.js     # authMiddleware, adminOnly
    middleware/upload.js   # multer middleware для загрузки файлов
    controllers/adminController.js  # справки, уведомления, backup
    controllers/authController.js   # login/register/changePassword
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
    lib/api.js            # axios-инстанс с авторизацией + downloadBlob()
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
- **Аутентификация**: токен в `localStorage` как `user:id:username:role` в base64. Middleware проверяет `Authorization: Bearer ...`.
- **Админские эндпоинты** (`/api/admin/*`, `/api/reports/*`, `/api/export/*`) требуют `adminOnly`. В `client/src/lib/api.js` есть axios-инстанс, который автоматически подставляет токен.
- **initDB()** создаёт таблицы и делает ALTER TABLE для старых БД. Если добавляешь новое поле — добавь ALTER.
- **Групповая выдача**: `POST /api/issues/batch` принимает `site_id, item_type_id, quantity, ...`.
- **Возврат СИЗ**: `PATCH /api/issues/:id/return` с телом `{ return_date, return_quantity }`.
- **Списание**: `PATCH /api/issues/:id/dispose`.
- **Увольнение**: `PATCH /api/employees/:id/terminate`.
- **Потребность**: `GET /api/admin/demand` + `GET /api/reports/demand/excel`.
- **Уведомления**: `GET /api/admin/notifications`.
- **Резервная копия**: `GET /api/admin/backup` (pg_dump).
- **Формы**: таблицы `forms` и `form_taken` создаются в `initDB()`. Роут `/api/forms` работает.
- **Push-уведомления**: таблица `push_subscriptions` создаётся в `initDB()`. Роуты `/api/push/*` работают. Service Worker: `client/public/sw.js`. Подписка в `App.jsx` через хук `usePushNotifications`.
- **Загрузка файлов**: реализована через `multer`. Эндпоинты `POST /api/upload/certificate` и `POST /api/upload/signature`. Файлы сохраняются в `/app/uploads` (certificates/ и signatures/). Статика доступна через `/uploads/*`.
- **Сидинг**: `node src/scripts/seed.js` из папки `server/`. Очищает все таблицы и заполняет демо-данными. Создаёт админ-пользователя `admin`/`admin` (если его нет).
- **Верификация документов**: `node src/scripts/verify-docs.js` из папки `server/`. Проверяет все эндпоинты экспорта и сохраняет файлы в `server/src/tmp/`.

## Известные проблемы / TODO
- **Исправлено**: `wear_time_override_months` не сохранялся при выдаче — было `wearTimeOverride`, стало `wear_time_override`.
- **Исправлено**: В `EmployeeList.jsx` добавлено `height` в `formData` — убрано React-предупреждение.
- **Исправлено**: Админские кнопки («Уволить» и др.) скрыты для не-админов в UI.
- **Исправлено**: Добавлены `authMiddleware + adminOnly` на `exportRoutes` и `reportRoutes`.
- **Исправлено**: В `reportController.js` отсутствовал импорт `docx` и вспомогательные функции для генерации Word-отчётов. Теперь отчёты генерируются корректно.
- **Исправлено**: В `exportController.js` в `exportConsumables` добавлены `employee_name` и `personnel_number` в data для шаблона.
- **Исправлено**: В `Reports.jsx` все запросы к `/api/admin/*` и `/api/reports/*` теперь идут через авторизованный axios-инстанс из `lib/api.js`. Экспорты скачиваются через `downloadBlob()` с заголовком `Authorization`.
- **Исправлено**: Шапка сайта сделана белой, добавлен логотип `logo.webp`.
- **Добавлено**: Page-specific темизация для всех 11 страниц через CSS-переменные `.page-*`.
- **Добавлено**: Класс `.action-buttons` для выравнивания кнопок «Карточка»/«Уволить» в таблице сотрудников.
- **Добавлено**: Фронтенд-тесты на vitest + testing-library (`client/src/__tests__/`).
- **Добавлено**: Бэкенд-тесты на node:test (`server/tests/api.test.js`) — 10 тестов, покрывают auth и wear_time_override.
- **Seed**: создаёт 11 сотрудников (включая 1 уволенного), 13 позиций, 14 сертификатов (active + 1 expired), 143 выдачи (разные статусы), 312 норм, 3 формы, 5 push-подписок, админ-пользователя.
- **Токен для тестов/ручного доступа**: admin/admin → localStorage token = `Buffer.from('1:admin:admin').toString('base64')`.

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
