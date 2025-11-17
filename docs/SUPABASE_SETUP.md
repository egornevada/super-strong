# Supabase Setup для Super Strong

## Что было сделано (Фаза 1-3 миграции)

### Проблема была
- Backend использовал **две разные БД одновременно**:
  1. Локальный PostgreSQL (5432) для auth, workout, exercise
  2. Supabase REST API (8000) для supabase_users, supabase_workouts
- Это вызывало **дублирование тренировок** при выходе из созданной тренировки

### Решение
Миграция на **единую Supabase архитектуру**:
```
Frontend (http://localhost:5173)
    ↓
Backend (http://localhost:8000)
    ↓
Supabase PostgreSQL (localhost:54322)
    ↓
Supabase REST API (localhost:54321)
```

---

## Быстрая установка Supabase (для новых разработчиков)

### 1. Запустить Supabase локально
```bash
supabase start
```

Это автоматически:
- Создаёт 12 Docker контейнеров
- Запускает PostgreSQL на порту 54322
- Запускает REST API (Kong) на порту 54321
- Запускает Studio на порту 54323

### 2. Открыть Supabase Studio
```
http://localhost:54323
```

### 3. Создать schema в SQL Editor
Все **ТОЛЬКО** через **SQL Editor** в Studio (никаких миграций через CLI):

```sql
-- STEP 1: Включить расширение UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 2: Создать таблицу users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 3: Создать таблицу exercises (справочник упражнений из Directus)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  directus_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 4: Создать таблицу дней (user_days)
CREATE TABLE user_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- STEP 5: Создать таблицу упражнений дня (простые упражнения без тренировки)
CREATE TABLE user_day_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_id UUID NOT NULL REFERENCES user_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 6: Создать таблицу подходов (для простых упражнений)
CREATE TABLE user_day_exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_exercise_id UUID NOT NULL REFERENCES user_day_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 7: Создать таблицу тренировок (workout sessions)
CREATE TABLE user_day_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_day_id UUID NOT NULL REFERENCES user_days(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, user_day_id)
);

-- STEP 8: Создать таблицу упражнений в тренировке
CREATE TABLE user_day_workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_workout_id UUID NOT NULL REFERENCES user_day_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 9: Создать таблицу подходов в тренировке
CREATE TABLE user_day_workout_exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_workout_exercise_id UUID NOT NULL REFERENCES user_day_workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 10: Создать индексы для производительности
CREATE INDEX idx_user_days_user_id ON user_days(user_id);
CREATE INDEX idx_user_days_date ON user_days(date);
CREATE INDEX idx_user_day_exercises_user_day_id ON user_day_exercises(user_day_id);
CREATE INDEX idx_user_day_exercise_sets_user_day_exercise_id ON user_day_exercise_sets(user_day_exercise_id);
CREATE INDEX idx_exercises_directus_id ON exercises(directus_id);
CREATE INDEX idx_user_day_workouts_user_id ON user_day_workouts(user_id);
CREATE INDEX idx_user_day_workouts_user_day_id ON user_day_workouts(user_day_id);
CREATE INDEX idx_user_day_workouts_started_at ON user_day_workouts(started_at);
CREATE INDEX idx_user_day_workout_exercises_workout_id ON user_day_workout_exercises(user_day_workout_id);
CREATE INDEX idx_user_day_workout_exercises_exercise_id ON user_day_workout_exercises(exercise_id);
CREATE INDEX idx_user_day_workout_exercises_position ON user_day_workout_exercises(user_day_workout_id, position);
CREATE INDEX idx_user_day_workout_exercise_sets_exercise_id ON user_day_workout_exercise_sets(user_day_workout_exercise_id);
```

### 4. Добавить UNIQUE ограничение (предотвращение дубликатов)
```sql
-- STEP 11: Уникальность упражнений в тренировке (одно упражнение не может быть дважды с одной позиции)
ALTER TABLE user_day_workout_exercises
ADD CONSTRAINT unique_workout_exercise_position
UNIQUE(user_day_workout_id, exercise_id, position);
```

### 5. Обновить Backend docker-compose.dev.yml

Уже настроено, но убедитесь что есть:
```yaml
backend:
  environment:
    DATABASE_URL: postgresql://postgres:postgres@supabase_db_super-strong:5432/postgres
    SUPABASE_URL: "http://supabase_kong_super-strong:8000"
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz"
  networks:
    - super-strong-network
    - supabase_network_super-strong
```

### 6. Запустить Backend
```bash
docker-compose -f docker-compose.dev.yml up -d
```

---

## ⚠️ ВАЖНО: Все изменения ТОЛЬКО через SQL Editor!

**НИКОГДА не используйте миграции через CLI** (`supabase migration`).

### Почему?
- Быстрее и проще
- Можно сразу видеть результат
- Не нужно перезагружать контейнеры
- Версионирование делаете вручную в комментариях

### Как добавить новое поле?

1. Откройте http://localhost:54323
2. Перейдите в **SQL Editor**
3. Напишите ALTER TABLE:
```sql
-- [2025-11-17] Добавляем поле рейтинга нагрузки (RPE)
ALTER TABLE user_day_workout_exercise_sets
ADD COLUMN rpe INTEGER;

-- Создаём индекс
CREATE INDEX idx_user_day_workout_exercise_sets_rpe
ON user_day_workout_exercise_sets(rpe);
```
4. Нажимаете **Run** (Ctrl+Enter)
5. Готово!

### Как добавить новую таблицу?

```sql
-- [2025-11-17] Добавляем логирование изменений упражнений
CREATE TABLE user_day_workout_exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_workout_exercise_id UUID NOT NULL REFERENCES user_day_workout_exercises(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  old_value JSONB,
  new_value JSONB
);

CREATE INDEX idx_user_day_workout_exercise_logs_exercise_id
ON user_day_workout_exercise_logs(user_day_workout_exercise_id);
```

---

## Что было исправлено (Дублирование тренировок)

### Проблема
При выходе из созданной тренировки упражнения дублировались.

### Причины
1. Frontend накапливал данные вместо замены (merge вместо replace)
2. Нет UNIQUE ограничений в БД
3. Нет `position` для сортировки и идентификации

### Решение (выполнено в SQL Editor)
```sql
-- Удалить существующие дубликаты
DELETE FROM user_day_workout_exercises
WHERE id NOT IN (
  SELECT MIN(id)
  FROM user_day_workout_exercises
  GROUP BY user_day_workout_id, exercise_id
);

-- Добавить поле position
ALTER TABLE user_day_workout_exercises
ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Присвоить позиции
WITH ranked_exercises AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY user_day_workout_id ORDER BY created_at) as position
  FROM user_day_workout_exercises
)
UPDATE user_day_workout_exercises
SET position = ranked_exercises.position
FROM ranked_exercises
WHERE user_day_workout_exercises.id = ranked_exercises.id;

-- Добавить UNIQUE ограничение
ALTER TABLE user_day_workout_exercises
ADD CONSTRAINT unique_workout_exercise_position
UNIQUE(user_day_workout_id, exercise_id, position);
```

### Результат
✅ Дубликаты удалены
✅ UNIQUE ограничение предотвращает новые дубликаты
✅ Позиции сохраняют порядок упражнений

---

## Архитектура (итоговая)

### Иерархия данных
```
user
  └─ user_day (date)
      ├─ user_day_exercises (простые упражнения)
      │   └─ user_day_exercise_sets (подходы)
      └─ user_day_workouts (тренировки)
          └─ user_day_workout_exercises (упражнения в тренировке)
              └─ user_day_workout_exercise_sets (подходы в тренировке)
```

### Таблицы
| Таблица | Назначение |
|---------|-----------|
| `users` | Пользователи (Telegram ID, username) |
| `exercises` | Справочник упражнений из Directus |
| `user_days` | Дни тренировок пользователя |
| `user_day_exercises` | Упражнения простого дня |
| `user_day_exercise_sets` | Подходы для простых упражнений |
| `user_day_workouts` | Тренировочные сессии |
| `user_day_workout_exercises` | Упражнения в тренировке (с `position` для уникальности) |
| `user_day_workout_exercise_sets` | Подходы в тренировке |

### Constraints (ограничения)
- `users(telegram_id)` - UNIQUE
- `users(username)` - UNIQUE
- `exercises(directus_id)` - UNIQUE
- `user_days(user_id, date)` - UNIQUE
- `user_day_workouts(user_id, user_day_id)` - UNIQUE
- `user_day_workout_exercises(user_day_workout_id, exercise_id, position)` - UNIQUE (**главное от дубликатов**)

---

## Проверка здоровья

### Проверить Supabase
```bash
# Должно быть running
docker ps | grep supabase

# Проверить БД
curl http://localhost:54321/rest/v1/users -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Проверить Backend
```bash
curl http://localhost:8000/health
# {"status":"ok","environment":"development","version":"0.1.0"}
```

### Проверить что таблицы есть в Supabase Studio
1. Откройте http://localhost:54323
2. Левая панель → Table Editor
3. Должны быть все 8 таблиц

---

## Для будущих обновлений

Когда нужно что-то изменить в schema:

1. **Добавить поле**: Откройте Studio → SQL Editor → `ALTER TABLE ... ADD COLUMN ...`
2. **Удалить поле**: `ALTER TABLE ... DROP COLUMN ...`
3. **Добавить constraint**: `ALTER TABLE ... ADD CONSTRAINT ...`
4. **Создать индекс**: `CREATE INDEX ...`
5. **Добавить таблицу**: `CREATE TABLE ...`

**Всегда** выполняйте через SQL Editor в Supabase Studio, никогда не используйте миграции.

---

## References

- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase CLI](https://supabase.com/docs/reference/cli)
