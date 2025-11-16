# Super Strong Backend

Python FastAPI backend для приложения Super Strong.

## Быстрый старт

### 1. Подготовка окружения

```bash
# Перейти в папку backend
cd backend

# Создать виртуальное окружение (если еще нет)
python3.14 -m venv venv

# Активировать окружение
source venv/bin/activate  # macOS/Linux
# или
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt
```

### 2. Запуск Docker Supabase локально

```bash
# Из корня проекта
docker-compose -f docker-compose.local.yml up -d
```

Сервисы станут доступны на:
- PostgreSQL: localhost:5432
- Supabase Studio: http://localhost:5555
- Redis: localhost:6379

### 3. Запуск backend

```bash
# Из папки backend (с активированным venv)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Приложение будет доступно на http://localhost:8000

### 4. Документация API

После запуска приложения:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI приложение
│   ├── config.py            # Конфигурация
│   ├── database.py          # Подключение БД
│   │
│   ├── core/
│   │   ├── security.py      # JWT, Telegram валидация
│   │   └── directus_sync.py # Синхронизация с Directus (TODO)
│   │
│   ├── models/              # SQLModel модели (БД слой)
│   │   ├── user.py
│   │   ├── workout.py
│   │   └── exercise.py
│   │
│   ├── schemas/             # Pydantic схемы (API контракт)
│   │   ├── user.py          # TODO
│   │   ├── workout.py       # TODO
│   │   └── statistics.py    # TODO
│   │
│   ├── api/v1/              # API endpoints
│   │   ├── auth.py          # TODO
│   │   ├── workouts.py      # TODO
│   │   ├── exercises.py     # TODO
│   │   ├── statistics.py    # TODO
│   │   └── router.py        # TODO
│   │
│   └── services/            # Бизнес-логика
│       ├── statistics.py    # TODO
│       └── workout_service.py # TODO
│
├── .env                 # Локальные переменные окружения
├── .env.example         # Пример конфигурации
├── requirements.txt     # Python зависимости
├── .gitignore
└── README.md
```

## Переменные окружения

Скопируй `.env.example` в `.env` и заполни необходимые значения:

```bash
cp .env.example .env
```

**Важные переменные:**
- `DATABASE_URL` - строка подключения к PostgreSQL
- `SECRET_KEY` - секретный ключ для JWT (сгенерируй новый для production)
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `DIRECTUS_URL` - URL Directus CMS

## Разработка

### Форматирование кода

```bash
# Black для форматирования
black app/

# isort для сортировки импортов
isort app/
```

### Проверка типов

```bash
mypy app/
```

### Тестирование

```bash
pytest tests/
```

## Deployment

### На Selectel

1. Убедись что на сервере установлен Python 3.14
2. Скопируй backend на сервер
3. Создай venv и установи зависимости
4. Обнови docker-compose на сервере (добавь сервис backend)
5. Используй gunicorn для production запуска

## Архитектура и масштабируемость

### Модульная структура

Проект спроектирован для легкого масштабирования:

- **models/** - слой БД (SQLModel, можно разделить на микросервисы)
- **schemas/** - слой API контракта (независим от БД)
- **services/** - бизнес-логика (полностью отделена)
- **api/v1/** - endpoints (маршрутизация)

### Версионирование API

API использует версионирование (`/api/v1/`), что позволяет добавлять новые версии для мобильных приложений без переломов.

### Будущие микросервисы

Возможно разделение на отдельные микросервисы:
- `auth-service` - аутентификация и авторизация
- `workouts-service` - управление тренировками
- `statistics-service` - расчет статистики
- `notifications-service` - отправка уведомлений

## Полезные ссылки

- [FastAPI документация](https://fastapi.tiangolo.com/)
- [SQLModel](https://sqlmodel.tiangolo.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Supabase](https://supabase.com/docs)
