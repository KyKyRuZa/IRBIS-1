# IRBIS ППЦ — Система учёта спецодежды

Система учёта специальной одежды, обуви и СИЗ (средств индивидуальной защиты) для
автозаправочных станций. Включает выдачу, возвраты, списание, учёт сертификатов,
уведомления и push-рассылку.

## Требования

- Node.js 22+ (рекомендуется 24.x)
- Docker + Docker Compose
- PostgreSQL 17 + PgBouncer
- Redis

## Быстрый старт (Docker)

```bash
# Production
docker compose build
docker compose up -d

# или Dev (с горячей перезагрузкой)
docker compose -f docker-compose.dev.yml up -d --build
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Конфигурация окружения

Перед запуском создайте `.env` в корне проекта:

```bash
cp .env.example .env
# отредактировать значения и сгенерировать секреты:
#   npx web-push generate-vapid-keys  → VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
#   openssl rand -hex 32             → JWT_SECRET
#   openssl rand -hex 32             → REDIS_PASSWORD
```

Для локальной разработки также нужен `server/.env.example`:

```bash
cd server
cp .env.example .env
```

## Миграции и seed

```bash
# Применить миграции
docker compose exec backend npx prisma migrate deploy

# Сбросить и заполнить тестовыми данными
docker compose exec backend node src/scripts/seed.js --reset
```

Без флага `--reset` сидер пропускает заполнение, если БД уже содержит данные.

## Тесты

Тестовая БД: `postgresql://postgres:postgres@localhost:5433/irbis_test`

Перед запуском тестов создайте и настройте тестовую БД:

```bash
# Создать тестовую БД (один раз)
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d postgres -c "CREATE DATABASE irbis_test;"

# Применить схему
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/irbis_test' npx prisma db push

# Или использовать миграции
DATABASE_URL='postgresql://postgres:postgres@localhost:5433/irbis_test' npx prisma migrate deploy
```

```bash
cd server
npm test              # один запуск
npm run test:watch    # режим разработчика
```

## Модули

1. **Сотрудники** — карточки с ФИО, должностью, объектом, размерами
2. **Номенклатура** — спецодежда, обувь, СИЗ, расходники
3. **Нормы выдачи** — периодичность и количество по категориям
4. **Выдача** — оформление факта выдачи с расчётом сроков носки
5. **Сертификаты** — учёт действия и просрочки
6. **Отчёты** — история выдач и истекающие сроки
