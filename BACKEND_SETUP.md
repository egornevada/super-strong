# Super Strong Backend - Local Development Setup

## Предварительные требования

- **Python 3.14** - [скачать](https://www.python.org/downloads/)
- **Docker Desktop** - [скачать](https://www.docker.com/products/docker-desktop)
- **Git** - уже установлен

## Шаг 1: Развернуть локальную БД (Docker)

### 1.1 Убедись что Docker запущен

```bash
docker --version
docker ps
```

### 1.2 Запустить Docker Compose

```bash
# Из корня проекта (super-strong/)
docker-compose -f docker-compose.dev.yml up -d
```

**Проверь что сервисы запустились:**

```bash
docker-compose -f docker-compose.dev.yml ps
```

**Должны быть видны:**
- `super-strong-postgres` - PostgreSQL (порт 5432)
- `super-strong-redis` - Redis (порт 6379)
- `super-strong-backend` - FastAPI backend (порт 8000)

**Просмотр логов:**

```bash
# Все сервисы
docker-compose -f docker-compose.dev.yml logs -f

# Только backend
docker-compose -f docker-compose.dev.yml logs -f backend

# Только БД
docker-compose -f docker-compose.dev.yml logs -f postgres
```

## Шаг 2: Настроить Python окружение

### 2.1 Перейти в папку backend

```bash
cd backend
```

### 2.2 Создать виртуальное окружение

**macOS/Linux:**

```bash
python3.14 -m venv venv
source venv/bin/activate
```

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

### 2.3 Установить зависимости

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Шаг 3: Запустить Backend

**Вариант 1: Через Docker Compose (рекомендуется)**

```bash
# Из корня проекта
docker-compose -f docker-compose.dev.yml up
```

Backend будет запущен с hot reload и доступен на http://localhost:8000

**Вариант 2: Локально через uvicorn**

```bash
# Из папки backend (с активированным venv)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Шаг 4: Проверить что всё работает

### 4.1 Health Check

```bash
curl http://localhost:8000/health
```

**Ответ:**

```json
{
  "status": "ok",
  "environment": "development",
  "version": "0.1.0"
}
```

### 4.2 Swagger UI (Interactive Documentation)

Открыть в браузере: http://localhost:8000/docs

Здесь можешь тестировать все endpoints

### 4.3 ReDoc (Alternative Documentation)

Открыть в браузере: http://localhost:8000/redoc

## Шаг 5: Проверить подключение к БД

```bash
# Подключиться к PostgreSQL
psql -h localhost -U postgres -d super_strong

# Пароль: postgres_local_dev

# В psql:
\dt  # Список таблиц (должны быть users, workouts, exercises)
\q   # Выход
```

**Или через Python:**

```bash
# В папке backend (с активированным venv)
python

# В Python REPL:
from app.database import AsyncSessionLocal
from app.models import User, Workout, Exercise
# Должны импортироваться без ошибок
```

## Troubleshooting

### Docker не запускается

```bash
# Убедись что Docker Desktop запущена
# Перезагруми Docker
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Ошибка подключения к БД

```
psycopg2.OperationalError: could not connect to server

# Решение:
# 1. Проверь что postgres container запущен
docker ps | grep postgres

# 2. Проверь что DATABASE_URL в .env правильный
cat backend/.env | grep DATABASE_URL

# 3. Перезагруми Docker
docker-compose -f docker-compose.dev.yml restart postgres
```

### Порт уже занят

```bash
# Найти процесс на порту 8000
lsof -i :8000

# Или использовать другой порт
uvicorn app.main:app --reload --port 8001
```

### Ошибка Python версии

```bash
# Проверь что установлен Python 3.14
python3.14 --version

# Используй python3.14 вместо python3
python3.14 -m venv venv
```

## Отключение services

Когда закончишь разработку:

```bash
# Остановить containers (данные сохранятся)
docker-compose -f docker-compose.dev.yml stop

# Полностью удалить containers и volumes
docker-compose -f docker-compose.dev.yml down -v
```

## Структура данных

После первого запуска backend автоматически создаст таблицы:

```
users
  id (PK)
  telegram_id (unique)
  username
  first_name
  last_name
  subscription_tier
  subscription_expires_at
  created_at
  updated_at
  is_active
  chat_id

workouts
  id (PK)
  user_id (FK)
  date
  total_weight
  total_sets
  notes
  created_at
  updated_at
  is_deleted

exercises
  id (PK)
  workout_id (FK)
  exercise_id (from Directus)
  weight
  sets
  reps
  notes
  order
  created_at
  updated_at
  is_deleted
```

## Документация

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLModel Docs](https://sqlmodel.tiangolo.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/docs/)
- [Uvicorn Docs](https://www.uvicorn.org/)

## Что дальше?

После успешного запуска:

1. ✅ Backend запущен и работает
2. ✅ БД инициализирована
3. 🔄 Далее: Реализовать endpoints (Фаза 1.2)
   - Telegram авторизация
   - CRUD для workouts
   - CRUD для exercises
   - Статистика

Смотри `../super_strong_backend_migration_plan.md` для полного плана
