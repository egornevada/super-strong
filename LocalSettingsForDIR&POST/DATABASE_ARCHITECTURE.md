# База Данных - Архитектура и Описание

## Общая структура

Проект использует **две отдельные PostgreSQL базы данных**:

### 1. **Directus DB** (`directus`)
- **Назначение**: CMS для управления упражнениями и контентом
- **Порт**: 8055 (Directus UI)
- **Пользователь**: `directus` / пароль: `directus`
- **Таблицы**:
  - `categories` - категории упражнений (Грудь, Спина, Ноги и т.д.)
  - `exercises` - список упражнений с описанием, инструкциями, сложностью

### 2. **Super Strong DB** (`super_strong`)
- **Назначение**: Хранение данных тренировок пользователей
- **Порт**: 5432 (PostgreSQL)
- **REST API**: 3000 (PostgREST)
- **Пользователь**: `postgres` / пароль: `postgres`
- **Таблицы**:
  - `users` - пользователи приложения (username, telegram_id)
  - `workouts` - сессии тренировок (дата, пользователь)
  - `workout_sets` - подходы (репы, вес, номер подхода в упражнении)

---

## Таблица: Users

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  telegram_id BIGINT,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Описание**:
- Каждый пользователь имеет уникальный `username`
- `telegram_id` опционально для Telegram Web App интеграции
- `id` используется как foreign key в таблице workouts

---

## Таблица: Workouts

```sql
CREATE TABLE workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, workout_date)
);
```

**Описание**:
- Одна запись = одна тренировка на конкретный день
- `UNIQUE(user_id, workout_date)` - пользователь может иметь только одну тренировку в день
- При сохранении новой тренировки приложение проверяет если существует запись на эту дату
- Если существует - используется старая, если нет - создается новая

---

## Таблица: Workout Sets

```sql
CREATE TABLE workout_sets (
  id BIGSERIAL PRIMARY KEY,
  workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id VARCHAR(255) NOT NULL, -- UUID из Directus
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight DECIMAL(10, 2) NOT NULL CHECK (weight > 0),
  set_order INTEGER NOT NULL CHECK (set_order > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Описание**:
- Каждый подход связан с конкретной тренировкой
- `exercise_id` - это UUID упражнения из Directus (не локальный ID)
- `set_order` - порядок подходов в упражнении (1, 2, 3...)
- `reps` и `weight` - количество повторений и вес в килограммах
- При удалении workout - все workout_sets удаляются автоматически (CASCADE)

---

## Таблица: Categories (Directus)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  sort INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Категории упражнений**:
- Грудь
- Спина
- Ноги
- Плечи
- Руки
- Пресс

---

## Таблица: Exercises (Directus)

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  instructions TEXT,
  muscle_group VARCHAR(255),
  difficulty VARCHAR(50),
  image_id UUID,
  sort INTEGER,
  status VARCHAR(50) DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Поля**:
- `id` - UUID упражнения (используется в workout_sets как exercise_id)
- `name` - название упражнения (Жим лёжа, Подтягивания и т.д.)
- `description` - описание упражнения
- `category_id` - связь с категорией
- `instructions` - инструкции как выполнять
- `muscle_group` - какая мышца работает
- `difficulty` - Легкий, Средний, Сложный
- `status` - published/draft (для публикации)

---

## Поток записи тренировки

### Шаг 1: Пользователь открывает день без тренировки
1. Приложение делает запрос к `/workout_sets?workout_id=eq.{id}`
2. Если нет workout_id - показывается экран выбора упражнений

### Шаг 2: Пользователь выбирает упражнения
1. Упражнения берутся из Directus (`GET /api/items/exercises`)
2. Пользователь выбирает несколько упражнений

### Шаг 3: Пользователь добавляет подходы
1. Для каждого упражнения добавляются подходы (репы + вес)
2. Данные хранятся в памяти приложения (React state)

### Шаг 4: Пользователь сохраняет тренировку
1. **Проверка существования workout**:
   ```
   GET /workouts?user_id=eq.{userId}&workout_date=eq.2025-11-01
   ```
   - Если существует → используем это workout.id
   - Если нет → создаём новый

2. **Создание workout**:
   ```
   POST /workouts
   {
     "user_id": 123,
     "workout_date": "2025-11-01"
   }
   ```

3. **Удаление старых workout_sets** (если это редактирование):
   ```
   DELETE /workout_sets?workout_id=eq.{workoutId}
   ```

4. **Создание новых workout_sets**:
   ```
   POST /workout_sets
   {
     "workout_id": 456,
     "exercise_id": "uuid-from-directus",
     "reps": 10,
     "weight": 70.5,
     "set_order": 1
   }
   ```
   (повторяется для каждого подхода)

5. **Обновление UI**:
   - Добавляется точка-индикатор на календарь
   - Пользователь остаётся на странице редактирования

---

## Синхронизация данных

### При загрузке приложения:
1. Загружаются все упражнения из Directus
2. Загружаются тренировки за **текущий месяц** (+ соседние месяцы)
3. Если есть одна или несколько тренировок - на календаре появляются точки

### При скроллинге календаря:
- Ничего не загружается (уже загружено)
- Пользователь может свободно скроллить

### При редактировании тренировки:
- Загружаются workout_sets этой тренировки
- Пользователь может изменять подходы
- При сохранении - обновляется БД

---

## API Endpoints (PostgREST)

### Workouts
```
GET /workouts - получить все тренировки
GET /workouts?user_id=eq.123 - тренировки пользователя
GET /workouts?user_id=eq.123&workout_date=eq.2025-11-01 - конкретный день
POST /workouts - создать тренировку
DELETE /workouts?id=eq.456 - удалить тренировку
```

### Workout Sets
```
GET /workout_sets - все подходы
GET /workout_sets?workout_id=eq.456 - подходы конкретной тренировки
POST /workout_sets - добавить подход
DELETE /workout_sets?workout_id=eq.456 - удалить все подходы тренировки
```

### Users
```
GET /users - все пользователи
POST /users - создать пользователя
GET /users?username=eq.john - найти пользователя по username
```

---

## Миграции и Инициализация

### База super_strong инициализируется через:
- `database/migrations/01-init.sql` - создание БД и пользователя
- `database/migrations/001_init_schema.sql` - таблицы users, workouts, workout_sets

### База directus инициализируется через:
- Директус автоматически создает свои таблицы при первом запуске
- `database/migrations/002-directus-exercises.sql` - данные упражнений и категорий

---

## Переменные окружения

```
VITE_API_URL=http://localhost:3000          # PostgREST для super_strong
VITE_DIRECTUS_URL=http://localhost:8055     # Directus CMS
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=password
```

---

## Важные замечания

1. **Row Level Security (RLS)** - таблицы имеют политики доступа, но сейчас они открыты для анонимного доступа
2. **На сервере** будет свой адрес БД и пароли (не localhost)
3. **Trigger функции** автоматически обновляют `updated_at` при каждом изменении
4. **Индексы** на часто используемых полях (user_id, workout_date, exercise_id) для быстрого поиска
