# Следующие шаги после Phase 1.2

Этот документ описывает приоритизированные задачи для продолжения разработки.

**Документация проекта:**
- [super_strong_backend_migration_plan.md](./super_strong_backend_migration_plan.md) - полный план миграции
- [PHASE_1_2_IMPLEMENTATION.md](./PHASE_1_2_IMPLEMENTATION.md) - что реализовано в Phase 1.2
- [CLAUDE.md](./CLAUDE.md) - инструкции для разработки фронтенда

---

## 🎯 Приоритет 1: Интеграция фронтенда с бэкендом (URGENT)

### 1.1 Обновить API client в фронтенде

**Файлы для изменения:**
- `src/services/authApi.ts` - обновить на новые endpoints
- `src/services/workoutsApi.ts` - CRUD для тренировок
- `src/lib/api.ts` - настроить базовый URL на `http://localhost:8001`

**Endpoints из [PHASE_1_2_IMPLEMENTATION.md](./PHASE_1_2_IMPLEMENTATION.md):**
```
POST   /api/v1/auth/telegram
GET    /api/v1/workouts?token=JWT
POST   /api/v1/workouts?token=JWT
PUT    /api/v1/workouts/{id}?token=JWT
DELETE /api/v1/workouts/{id}?token=JWT
```

**Передача JWT токена:**
- Все endpoints требуют `token` в query параметре
- Пример: `http://localhost:8001/api/v1/workouts?token=YOUR_JWT_TOKEN`

---

### 1.2 Реализовать Telegram авторизацию на фронтенде

**Отправить initData с фронтенда:**
```typescript
// src/services/authApi.ts
const response = await fetch('http://localhost:8001/api/v1/auth/telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ init_data: window.Telegram.WebApp.initData })
});

const { access_token } = await response.json();
// Сохрани access_token в localStorage
```

**Проверить в браузере:**
- Telegram WebApp должна передать `window.Telegram.WebApp.initData`
- Для non-Telegram браузеров используй существующий UsernameModal

---

## 🎯 Приоритет 2: Миграция данных и таблиц

### 2.1 Создать таблицы в PostgreSQL

**Текущее состояние:**
- Модели определены в `app/models/` (user.py, workout.py, exercise.py)
- SQLAlchemy готов создавать таблицы автоматически

**Как запустить миграцию:**
1. Проверить соединение с PostgreSQL:
   ```bash
   cd backend
   source venv/bin/activate
   python3 -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"
   ```

2. Если ошибка соединения - см. раздел "Проблемы" ниже

**Альтернатива - использовать Alembic (для production):**
```bash
# Инициализировать миграции
alembic init migrations

# Создать миграцию
alembic revision --autogenerate -m "Initial setup"

# Применить миграцию
alembic upgrade head
```

Документация: [super_strong_backend_migration_plan.md](./super_strong_backend_migration_plan.md#этап-3-база-данных)

---

### 2.2 Мигрировать данные пользователей

**Текущие данные хранятся в:**
- Supabase (облачный) - для users и workouts
- LocalStorage (фронтенд) - временные workout данные

**План миграции:**
1. Экспортировать существующих пользователей из Supabase
2. Запустить скрипт для массовой вставки в новую БД
3. Сверить количество записей

---

## 🎯 Приоритет 3: Тестирование endpoints

### 3.1 Проверить все endpoints работают

**Доступные endpoints из [PHASE_1_2_IMPLEMENTATION.md](./PHASE_1_2_IMPLEMENTATION.md):**

```bash
# 1. Health check
curl http://localhost:8001/health

# 2. Авторизация (требует валидный Telegram initData)
curl -X POST http://localhost:8001/api/v1/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"init_data": "..."}'

# 3. Список тренировок (требует JWT token)
curl "http://localhost:8001/api/v1/workouts?token=JWT_TOKEN"

# 4. Каталог упражнений (не требует auth)
curl "http://localhost:8001/api/v1/exercises-catalog?limit=10"

# 5. Статистика (требует JWT token)
curl "http://localhost:8001/api/v1/statistics/daily?date=2025-11-16&token=JWT_TOKEN"
```

**Документация OpenAPI:** http://localhost:8001/docs

---

## 🎯 Приоритет 4: Решить проблему с соединением БД

### 4.1 Database Connection Issue

**Текущая проблема:**
- Supabase PostgreSQL работает в Docker контейнере на IP 172.19.0.4
- Host машина не может подключиться к Docker сети

**Решения (выбери одно):**

**Вариант A: Использовать Supabase через Docker (рекомендуется)**
```bash
# В supabase-docker/docker директории
docker-compose up -d
# Проверить работает ли PostgreSQL
docker exec supabase-db psql -U postgres -c "SELECT 1"
```

**Вариант B: Использовать облачную Supabase**
- Отредактировать `.env` на облачную DATABASE_URL
- Быстро, но не локально

**Вариант C: Запустить PostgreSQL локально (без Docker)**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Linux
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# В .env установи:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/super_strong
```

**Проверить соединение:**
```python
import asyncio
from app.database import init_db

asyncio.run(init_db())  # Если успешно - таблицы созданы
```

**Документация:** [super_strong_backend_migration_plan.md](./super_strong_backend_migration_plan.md#этап-3-база-данных)

---

## 🎯 Приоритет 5: Production-ready improvements

### 5.1 Безопасность (Security)

**Текущее состояние:**
- ✅ JWT authentication реализована
- ✅ SQL injection protection (через SQLModel)
- ✅ CORS middleware настроен
- ⚠️ Telegram signature verification готова, но не активирована

**Что нужно доделать:**

1. **Включить Telegram signature verification**
```python
# app/routes/auth.py:56
# Раскомментировать verify_telegram_init_data call
payload = AuthService.verify_telegram_init_data(
    init_data=request.init_data,
    bot_token=settings.TELEGRAM_BOT_TOKEN
)
```

2. **Добавить Rate Limiting**
```bash
pip install slowapi
```

3. **HTTPS для production**
- Использовать Nginx/Caddy reverse proxy
- Сертификат Let's Encrypt

**Документация:** [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)

---

### 5.2 Performance & Monitoring

**Что реализовать:**

1. **Кеширование упражнений**
```bash
pip install redis
# app/services/directus.py - добавить кеш для get_exercises
```

2. **Логирование**
- Уже настроено: `logging.basicConfig()` в main.py
- Добавить structured logging (JSON format)

3. **Мониторинг**
```bash
pip install prometheus-client
# Добавить метрики для запросов, ошибок, latency
```

4. **Database Connection Pooling**
- Уже реализовано: `pool_size=10, max_overflow=20` в database.py

---

## 📋 Чек-лист для завершения фазы

- [ ] Фронтенд подключен к backend API
- [ ] Telegram авторизация работает end-to-end
- [ ] Все CRUD операции протестированы
- [ ] Таблицы успешно созданы в PostgreSQL
- [ ] Статистика рассчитывается корректно
- [ ] Directus API доступен и возвращает упражнения
- [ ] Все endpoints задокументированы в swagger (/docs)
- [ ] Нет ошибок в консоли backend
- [ ] Подготовлено для git commit

---

## 🚀 Phase 2 (Future)

Согласно [super_strong_backend_migration_plan.md](./super_strong_backend_migration_plan.md):

- **Phase 2.1:** WebSocket для real-time синхронизации
- **Phase 2.2:** Notification service для push-уведомлений
- **Phase 2.3:** Background tasks для вычисления статистики
- **Phase 3:** Мобильные приложения (Swift/Kotlin)
- **Phase 4:** Монетизация и подписки

---

## 📞 Если возникли проблемы

1. **Backend не стартует?** → Проверь логи в `/tmp/backend.log`
2. **БД не подключается?** → Проверь `DATABASE_URL` в `.env`
3. **Endpoints недоступны?** → Проверь CORS в `app/main.py:48`
4. **JWT токен невалиден?** → Проверь `SECRET_KEY` в `.env`

**Полная документация:** см. файлы выше
