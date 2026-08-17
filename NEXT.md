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
- Бэк: express, pg, bcrypt, docx, docxtemplater, exceljs, archiver, nodemon, node-cron, web-push, multer
- Фронт: react, react-router-dom v6, axios, vite
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
    services/notificationService.js # агрегация уведомлений в таблицу
    templates/             # .docx шаблоны
client/
  src/
    main.jsx              # createRoot, BrowserRouter
    App.jsx               # роуты, ProtectedRoute, навигация
    pages/*.jsx           # страницы
    index.css             # глобальные стили
```

## Важно
- **Роутер**: `BrowserRouter` только в `main.jsx`. В `App.jsx` его быть не должно — двойной роутер ломает рендер.
- **Аутентификация**: токен в `localStorage` как `user:id:username:role` в base64. Middleware проверяет `Authorization: Bearer ...`.
- **Админские эндпоинты** (`/api/admin/*`, `/api/export/demand/excel`) требуют `adminOnly`.
- **initDB()** создаёт таблицы и делает ALTER TABLE для старых БД. Если добавляешь новое поле — добавь ALTER.
- **Групповая выдача**: `POST /api/issues/batch` принимает `site_id, item_type_id, quantity, ...`.
- **Возврат СИЗ**: `PATCH /api/issues/:id/return` с телом `{ return_date, return_quantity }`.
- **Списание**: `PATCH /api/issues/:id/dispose`.
- **Увольнение**: `PATCH /api/employees/:id/terminate`.
- **Потребность**: `GET /api/admin/demand` + `GET /api/reports/demand/excel`.
- **Уведомления**: `GET /api/admin/notifications`.
- **Резервная копия**: `GET /api/admin/backup` (pg_dump).
- **Формы**: таблицы `forms` и `form_taken` теперь создаются в `initDB()`. Роут `/api/forms` уже работает.
- **Push-уведомления**: таблица `push_subscriptions` создаётся в `initDB()`. Роуты `/api/push/*` работают. Service Worker: `client/public/sw.js`. Подписка в `App.jsx` через хук `usePushNotifications`.
- **Загрузка файлов**: реализована через `multer`. Эндпоинты `POST /api/upload/certificate` и `POST /api/upload/signature`. Файлы сохраняются в `/app/uploads` (certificates/ и signatures/). Статика доступна через `/uploads/*`.

## Известные проблемы / TODO
- Push-уведомления реализованы: `web-push`, VAPID ключи в `.env`, таблица `push_subscriptions`, эндпоинты `/api/push/*`, Service Worker, интеграция в React.
- Загрузка файлов реализована: `multer`, эндпоинты `/api/upload/*`, хранилище `/uploads`, отображение файлов в UI.
- Нет прав доступа на уровне UI кроме скрытия ссылки «Учёт форм» у не-админов.
- В `Reports.jsx` `fetchDemand` и `fetchNotifications` требуют авторизации; при 401 не падают благодаря try/catch.
- В `EmployeeList.jsx` не хватает `height` в `formData` — есть предупреждение React, но не критично.
- `issue_records.reorder_date` заполняется автоматически за 2 месяца до expiry_date.
- `issue_records.return_quantity` по умолчанию 0, статус `returned` добавляется в CHECK.

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
