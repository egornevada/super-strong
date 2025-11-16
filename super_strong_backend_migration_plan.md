# План перехода Super Strong на Python Backend

## Этап 1: Настройка окружения разработки

### 1.1 Установка Python 3.14
- **Скачать Python 3.14:** https://www.python.org/downloads/
- **Официальная документация по установке:** https://docs.python.org/3/using/index.html
- **Рекомендация:** Поскольку планируешь мультиплатформенность и монетизацию, сразу настрой несколько виртуальных окружений (dev/staging/prod)

### 1.2 Управление версиями Python (опционально, но рекомендуется)
- **pyenv для управления версиями:** https://github.com/pyenv/pyenv
- **Зачем:** При добавлении Swift/Kotlin разработчиков важна консистентность версий Python

### 1.3 Создание виртуального окружения
- **Официальная документация venv:** https://docs.python.org/3/library/venv.html
- **Команды:**
```bash
# В корне проекта super-strong
mkdir backend
cd backend
python3.14 -m venv venv

# Активация окружения
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 1.4 Установка базовых зависимостей
```bash
# FastAPI с полным набором
pip install "fastapi[standard]"

# ASGI сервер для разработки
pip install "uvicorn[standard]"

# Для production (понадобится позже)
pip install gunicorn uvicorn-worker

# Создай requirements.txt
pip freeze > requirements.txt
```
- **Документация FastAPI:** https://fastapi.tiangolo.com/
- **Документация Uvicorn:** https://www.uvicorn.org/

## Этап 2: Структура проекта

### 2.1 Официальный шаблон FastAPI
- **Full Stack Template:** https://github.com/fastapi/full-stack-fastapi-template
- **Изучи структуру, но не копируй всё подряд - возьми только нужное**

### 2.2 Рекомендуемая структура для Super Strong
```
super-strong/
├── frontend/          # Твой существующий React
├── backend/
│   ├── venv/         # Виртуальное окружение
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # Точка входа FastAPI
│   │   ├── config.py               # Настройки и переменные окружения
│   │   ├── database.py             # Подключение к БД
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py            # Общие зависимости (auth, db session)
│   │   │   └── v1/                # Версионирование для будущих мобильных приложений
│   │   │       ├── __init__.py
│   │   │       ├── auth.py        # Telegram авторизация
│   │   │       ├── workouts.py    # Тренировки
│   │   │       ├── exercises.py   # Упражнения
│   │   │       ├── statistics.py  # Статистика
│   │   │       ├── templates.py   # Шаблоны тренировок (future)
│   │   │       └── groups.py      # Групповые тренировки (future)
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py        # JWT, хэширование
│   │   │   ├── telegram_auth.py   # Валидация Telegram initData
│   │   │   └── directus_sync.py   # Синхронизация с Directus
│   │   │
│   │   ├── models/                # SQLModel модели
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── workout.py
│   │   │   ├── exercise.py
│   │   │   └── subscription.py    # Для монетизации (future)
│   │   │
│   │   ├── schemas/               # Pydantic схемы для API
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── workout.py
│   │   │   └── statistics.py
│   │   │
│   │   └── services/              # Бизнес-логика
│   │       ├── __init__.py
│   │       ├── statistics.py     # Вычисление статистики
│   │       ├── workout_service.py
│   │       └── notification.py   # Для будущих push-уведомлений
│   │
│   ├── migrations/               # Alembic миграции
│   ├── tests/
│   ├── .env                     # Локальные настройки
│   ├── .env.example             # Пример настроек
│   └── requirements.txt
```

**Рекомендация:** Сразу создай структуру под будущие фичи (templates, groups, subscription), чтобы потом не переделывать архитектуру.

## Этап 3: База данных

### 3.1 Self-hosted Supabase (опционально для локальной разработки)
- **Официальная документация Docker setup:** https://supabase.com/docs/guides/self-hosting/docker
- **GitHub с docker-compose:** https://github.com/supabase/supabase/tree/master/docker

**Для начала можешь использовать облачную Supabase**, но для production нужен self-hosted:
```bash
# Скачай конфигурацию
git clone https://github.com/supabase/supabase.git
cd supabase/docker
cp .env.example .env
# Отредактируй .env под свои нужды
docker-compose up
```

**Рекомендация для будущего:**
- Настрой Realtime репликацию для WebSocket (нужна для синхронизации между устройствами)
- Создай отдельные роли для read/write операций
- Настрой backup стратегию: https://supabase.com/docs/guides/platform/backups

### 3.2 SQLAlchemy с SQLModel

**Зачем это нужно:** Python не может напрямую работать с PostgreSQL. SQLModel - это мост между Python и БД.

- **Официальная документация SQLModel:** https://sqlmodel.tiangolo.com/
- **FastAPI + SQLModel tutorial:** https://fastapi.tiangolo.com/tutorial/sql-databases/
- **Установка:**
```bash
pip install sqlmodel psycopg2-binary
```

**Пример модели для твоего проекта:**
```python
# models/user.py
from sqlmodel import SQLModel, Field
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: int = Field(primary_key=True)
    telegram_id: str = Field(unique=True, index=True)
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Для будущей монетизации
    subscription_tier: str = Field(default="free")
    subscription_expires_at: datetime | None = None
```

**Рекомендация:** Используй SQLModel вместо чистого SQLAlchemy - меньше кода, автоматическая типизация.

## Этап 4: Telegram авторизация

### 4.1 Валидация initData
- **Официальная документация Telegram:** https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
- **Python библиотека для валидации:** https://github.com/nimaxin/init-data-py

**Установка:**
```bash
pip install init-data-py
# Или реализуй сам по документации
pip install python-jose[cryptography]  # Для JWT токенов
```

### 4.2 Интеграция с Telegram Bot API
**Для будущих push-уведомлений:**
- **python-telegram-bot:** https://docs.python-telegram-bot.org/
```bash
pip install python-telegram-bot
```

**Рекомендация:** Сохраняй chat_id пользователей при авторизации для отправки уведомлений.

## Этап 5: Миграция бизнес-логики

### 5.1 Перенос статистики с фронтенда

**Background Tasks для асинхронных вычислений:**
- **Документация:** https://fastapi.tiangolo.com/tutorial/background-tasks/

**Структура сервиса статистики:**
```python
# services/statistics.py
class StatisticsService:
    async def calculate_monthly_stats(self, user_id: int, month: date):
        # Перенеси логику подсчёта totalWeight и totalSets
        pass
    
    async def calculate_personal_records(self, user_id: int):
        # Для будущей функции персональных рекордов
        pass
    
    async def compare_with_group(self, user_id: int, group_id: int):
        # Для будущих групповых сравнений
        pass
```

### 5.2 WebSocket для real-time синхронизации
- **Официальная документация FastAPI WebSocket:** https://fastapi.tiangolo.com/advanced/websockets/

**Для синхронизации между устройствами установи Redis:**
- **Redis документация:** https://redis.io/docs/
- **python-redis:** https://redis-py.readthedocs.io/
```bash
pip install redis
# Для локальной разработки запусти Redis в Docker:
docker run -d -p 6379:6379 redis:alpine
```

### 5.3 Интеграция с Directus
**Для синхронизации упражнений:**
```bash
pip install httpx  # Асинхронный HTTP клиент
```

## Этап 6: Локальная разработка

### 6.1 Переменные окружения
**Создай файл `.env`:**
```env
# База данных
DATABASE_URL=postgresql://postgres:password@localhost:5432/super_strong
# Или используй существующую Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Telegram
BOT_TOKEN=your-bot-token

# Directus
DIRECTUS_URL=http://your-server/directus
DIRECTUS_TOKEN=your-directus-token

# JWT
SECRET_KEY=your-secret-key-generate-with-openssl
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Окружение
ENVIRONMENT=development
DEBUG=true
```

### 6.2 Запуск для разработки
```bash
# Активируй виртуальное окружение
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Запускай с автоперезагрузкой
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**FastAPI автоматически создаст документацию:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Этап 7: Подготовка к production (на будущее)

### 7.1 Docker контейнеризация
- **Официальный Docker Python guide:** https://docs.docker.com/guides/python/
- **FastAPI Docker guide:** https://fastapi.tiangolo.com/deployment/docker/

**Dockerfile с multi-stage build:**
```dockerfile
# Будет нужен когда начнёшь деплоить
FROM python:3.14-slim as builder
# ... конфигурация
```

### 7.2 Для deployment на Selectel
**Когда дойдёшь до production:**
- **Gunicorn + Uvicorn документация:** https://www.uvicorn.org/deployment/
- Команда: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`
- Настрой systemd service для автозапуска

### 7.3 Мониторинг
**Для отслеживания при 1000+ пользователей:**
- **Python logging:** https://docs.python.org/3/howto/logging-cookbook.html
- **Structlog для структурированных логов:** https://www.structlog.org/
- **Prometheus метрики:** https://github.com/prometheus/client_python

## Этап 8: Интеграция с фронтендом

### 8.1 Постепенная миграция
**В React создай сервис для переключения:**
```javascript
// api/config.js
const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === 'true';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// api/workouts.js
export const getWorkoutStats = async (userId, month) => {
  if (USE_BACKEND) {
    // Запрос к Python backend
    return fetch(`${BACKEND_URL}/api/v1/statistics/monthly?user_id=${userId}&month=${month}`);
  } else {
    // Существующая логика Supabase
    return supabase.from('workouts')...
  }
}
```

### 8.2 Приоритет миграции функций
1. **Статистика** (totalWeight, totalSets) - изолирована и тяжёлая
2. **Авторизация** - переход на JWT токены
3. **CRUD операции** тренировок
4. **WebSocket** для real-time

## Подготовка под будущие функции

### Для монетизации
```python
# models/subscription.py
class Subscription(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    tier: str  # free, premium, pro
    expires_at: datetime
    payment_method: str | None
    stripe_customer_id: str | None  # Для Stripe интеграции
```

### Для шаблонов тренировок
```python
# models/template.py
class WorkoutTemplate(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    description: str | None
    created_by: int = Field(foreign_key="users.id")
    is_public: bool = Field(default=False)
    
class UserWorkoutTemplate(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    template_id: int = Field(foreign_key="workout_templates.id")
    is_favorite: bool = Field(default=False)
```

### Для групповых функций
```python
# models/group.py
class Group(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    description: str | None
    created_by: int = Field(foreign_key="users.id")
    
class GroupMember(SQLModel, table=True):
    id: int = Field(primary_key=True)
    group_id: int = Field(foreign_key="groups.id")
    user_id: int = Field(foreign_key="users.id")
    role: str = Field(default="member")  # member, admin
```

### Для push-уведомлений
**Celery для отложенных задач:**
- **Документация:** https://docs.celeryq.dev/
```bash
pip install celery[redis]
```

## Порядок реализации

### Неделя 1: Базовая настройка
- [ ] Настрой Python окружение
- [ ] Создай структуру проекта
- [ ] Подключись к существующей Supabase БД
- [ ] Реализуй базовые модели SQLModel

### Неделя 2: Авторизация и CRUD
- [ ] Реализуй Telegram авторизация с JWT
- [ ] Создай базовые CRUD endpoints для тренировок
- [ ] Протестируй с Swagger UI

### Неделя 3: Миграция логики
- [ ] Перенеси расчёт статистики на backend
- [ ] Оптимизируй запросы к БД
- [ ] Добавь кеширование частых запросов

### Неделя 4: Real-time и тестирование
- [ ] Добавь WebSocket для синхронизации
- [ ] Интегрируй с фронтендом через feature flag
- [ ] Протестируй на ограниченной группе пользователей

## Полезные команды

```bash
# Создание миграций (когда настроишь Alembic)
alembic init migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Форматирование кода
pip install black isort
black app/
isort app/

# Тестирование
pip install pytest pytest-asyncio
pytest tests/

# Проверка типов
pip install mypy
mypy app/
```

## Важные замечания

1. **Не спеши переносить всё сразу** - делай постепенно, функция за функцией
2. **Версионируй API с первого дня** (`/api/v1/`) для будущих мобильных приложений
3. **Документируй всё** - FastAPI автоматически создаёт Swagger, используй это
4. **Тестируй каждый endpoint** перед интеграцией с фронтендом
5. **Мониторь производительность** - особенно при переносе статистики

## Ресурсы для углубления

- **FastAPI полный курс:** https://fastapi.tiangolo.com/tutorial/
- **SQLModel tutorial:** https://sqlmodel.tiangolo.com/tutorial/
- **PostgreSQL оптимизация:** https://wiki.postgresql.org/wiki/Performance_Optimization
- **Python best practices:** https://docs.python-guide.org/
- **Telegram Mini Apps документация:** https://docs.telegram-mini-apps.com/
