# План миграции на единую Supabase архитектуру

## Текущее состояние (НЕПРАВИЛЬНО)
- Backend использует **две разные БД одновременно**:
  1. Локальный PostgreSQL (5432) для auth, workout, exercise
  2. Supabase REST API (8000) для supabase_users, supabase_workouts
- Конфликт источников истины, сложность, дублирование логики

## Целевое состояние (ПРАВИЛЬНО)
```
Frontend ↓ Backend ↓ Supabase REST API ↓ Supabase PostgreSQL
         (ВСЕ данные в одной Supabase!)
```

## Процесс выполнения

⚠️ **ВАЖНО**:
- Коммиты в git только когда **вы скажете** (не по умолчанию)
- Перед каждым действием буду **ссылаться на официальную документацию**
- После каждого шага буду **проговаривать что сделали и почему**

## Фазы миграции

### Фаза 1: Подготовка и backup
- [ ] Создать backup локальной БД
  - Документация: PostgreSQL dump
  - Команда: `pg_dump postgresql://user:pass@localhost:5432/super_strong > backup.sql`
- [ ] Проверить актуальность supabase-schema.sql
- [ ] Убедиться что Supabase запущена и доступна

### Фаза 2: Синхронизация схемы
- [ ] Применить supabase-schema.sql к Supabase локальной БД
  - Документация: Supabase Database Migrations (https://supabase.com/docs/reference/cli/supabase-db-push)
  - Способ: Выполнить SQL в Supabase Studio или через psql
- [ ] Проверить что все таблицы созданы корректно
  - Проверить в Supabase Studio (http://localhost:5555)
- [ ] Убедиться что миграции применены

### Фаза 3: Миграция данных
- [ ] Экспортировать данные из локального Postgres
  - Документация: PostgreSQL COPY или pg_dump
  - Формат: CSV или SQL insert statements
- [ ] Импортировать данные в Supabase PostgreSQL
  - Документация: PostgREST bulk insert (https://postgrest.org/en/stable/)
  - Способ: Через Supabase Studio или REST API
- [ ] Проверить консистентность данных
  - Проверить row count в обеих БД
  - Проверить что нет разломанных foreign keys

### Фаза 4: Обновление Backend
- [ ] Удалить локальный PostgreSQL из docker-compose.dev.yml
  - Причина: Он больше не нужен, все данные в Supabase
- [ ] Удалить init_db() вызов из main.py (lifespan функция)
  - Причина: Таблицы теперь создаются через Supabase migrations
- [ ] Удалить или переименовать старые routes (auth, workout, exercise)
  - Причина: Они работали с локальной БД, теперь используем supabase_users и supabase_workouts
- [ ] Проверить DATABASE_URL environment variable
  - Документация: Supabase REST API Overview (https://supabase.com/docs/guides/api)

### Фаза 5: Тестирование и валидация
- [ ] Перезапустить Backend контейнер
  - `docker-compose -f docker-compose.dev.yml up -d`
- [ ] Проверить /health endpoint
  - `curl http://localhost:8000/health`
- [ ] Проверить работу всех API endpoints (supabase_users, supabase_workouts)
  - Тестировать через Postman или curl
- [ ] Проверить данные в Supabase Studio (http://localhost:5555)
  - Убедиться что данные появились

### Фаза 6: Очистка и финализация
- [ ] Удалить локальные docker volumes (если нужны)
  - `docker volume rm super-strong-postgres_data super-strong-redis_data`
- [ ] Удалить старые routes файлы если полностью не используются
- [ ] Финальная валидация что всё работает

## Официальная документация

### Supabase
- **Local Development**: https://supabase.com/docs/guides/local-development
- **REST API Overview**: https://supabase.com/docs/guides/api
- **Database Migrations CLI**: https://supabase.com/docs/reference/cli/supabase-db-push
- **Authentication & RLS**: https://supabase.com/docs/learn/auth-deep-dive/auth-policies
- **Row Level Security**: https://supabase.com/docs/guides/database/postgres/row-level-security

### PostgREST (основа REST API)
- **PostgREST Documentation**: https://postgrest.org/en/stable/
- Автоматический REST API из PostgreSQL схемы
- Использует database roles для security
- Поддерживает CRUD, deep relational queries, views, functions

### Ключевые команды CLI
```bash
supabase init              # Инициализация проекта
supabase start             # Запуск локального стека (localhost:54323)
supabase db push           # Применить миграции к удаленной БД
supabase db pull           # Загрузить изменения со удаленной БД
supabase migration list    # Просмотр истории миграций
supabase migration repair  # Исправить рассинхронизацию
supabase db dump           # Экспорт схемы/данных
```

## Важные замечания

### Архитектура
1. Supabase запущена через `supabase start` (CLI), не через docker-compose
2. Kong gateway на portu 8000 маршрутизирует REST API запросы
3. Все данные будут в Supabase PostgreSQL (54322)
4. Никаких "костылей" с двумя БД

### REST API (PostgREST)
- **Автоматический**: REST API генерируется из schema БД в реальном времени
- **Быстрый**: Минимальный layer над PostgreSQL, каждый запрос → одна SQL query
- **Безопасный**: Используются database roles и Row Level Security (RLS)
- **Self-documenting**: Документация автоматически обновляется при изменении schema
- **Возможности**: CRUD, relational queries, views, functions, computed columns

### Row Level Security (RLS)
- **Обязательна**: RLS должна быть включена на всех таблицах в exposed схемах
- **Работает как WHERE**: Policies автоматически фильтруют rows на уровне БД
- **Роли**: `anon` (неаутентифицированные), `authenticated` (залогиненные)
- **Helper функции**: `auth.uid()`, `auth.jwt()` для policy условий
- **Синтаксис**:
  ```sql
  ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
  CREATE POLICY policy_name ON table_name FOR SELECT USING (auth.uid() = user_id);
  ```

## Pre-flight checks (ДО начала миграции)

- [ ] Supabase запущена: `docker ps | grep supabase`
- [ ] Kong доступен: `curl http://localhost:8000/health`
- [ ] Supabase Studio доступна: http://localhost:5555
- [ ] Git на чистой веке без незакоммиченных изменений
- [ ] Backup всех важных данных из локального Postgres
- [ ] Прочитано всё в этом файле и понята архитектура

## Потенциальные проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| Kong недоступен | Supabase не запущена | `supabase start` |
| Данные потеряны | Не сделан backup | Раньше начинать нельзя! |
| RLS блокирует запросы | Policies написаны неправильно | Отладить в Supabase Studio |
| Миграция не применяется | Migration history рассинхронизирована | `supabase migration repair` |
| Backend не видит таблицы | Таблицы в неправильной schema | Проверить `public` schema |

## Git и контроль версий

**Политика коммитов**: Коммиты **только когда вы скажете**, не автоматически.

**Рекомендуемые точки коммитов**:
1. После Фазы 1 (backup готов) - `git commit -m "chore: Backup before Supabase migration"`
2. После Фазы 2 (schema синхронизирована) - `git commit -m "feat: Synchronize schema to Supabase"`
3. После Фазы 3 (данные мигрированы) - `git commit -m "data: Migrate data to Supabase"`
4. После Фазы 4 (Backend обновлён) - `git commit -m "refactor: Unify on single Supabase architecture"`
5. После Фазы 5 (всё работает) - `git commit -m "test: Validate migration success"`

## Точки отката
- **До начала**: `git checkout feature/python-backend-directus` (вернуться на старую версию)
- **Если Supabase сломалась**: `supabase stop && supabase start` (перезагрузить)
- **Если всё совсем сломалось**: `supabase stop && docker system prune -a` (ядерный вариант)
