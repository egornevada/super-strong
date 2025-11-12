# Supabase Setup для Оптимизированной Загрузки Данных

Следуйте этим шагам чтобы применить RPC функции и индексы для улучшения производительности.

## 1️⃣ Применить SQL скрипты в Supabase Console

### Вариант A: Через Supabase Dashboard (GUI)

1. Перейти на https://supabase.com/dashboard
2. Выбрать ваш проект
3. Перейти в **SQL Editor**
4. Нажать **"New Query"**
5. Скопировать содержимое файла `create_rpc_get_month_workouts.sql`
6. Нажать **"Run"** (или Cmd+Enter)
7. Проверить что не было ошибок
8. Повторить для `add_performance_indexes.sql`

### Вариант B: Через Supabase CLI (Рекомендуется для production)

```bash
# Если еще не установлен Supabase CLI:
npm install -g @supabase/cli

# Инициализировать Supabase в проекте (если еще не сделано)
cd /Users/egornevada/Desktop/super-strong
supabase init

# Применить миграции
supabase migration up

# Или вручную:
supabase db push
```

## 2️⃣ Проверить что функции и индексы созданы

### Через Supabase Console:

**Проверить RPC функцию:**
1. SQL Editor → Выполнить:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_month_workouts';
```

Должно вывести одну строку с `get_month_workouts | FUNCTION`

**Проверить индексы:**
1. SQL Editor → Выполнить:
```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'workout_sessions',
  'user_days',
  'user_day_workout_exercises',
  'user_day_exercise_sets'
)
ORDER BY tablename, indexname;
```

Должно вывести ~7 новых индексов.

## 3️⃣ Обновить React код для использования RPC (опционально)

Если вы хотите использовать RPC вместо обычных SELECT запросов:

```typescript
// В src/services/workoutsApi.ts

export async function getMonthWorkoutsOptimized(
  userId: string,
  year: number,
  month: number
) {
  const { data, error } = await supabase.rpc('get_month_workouts', {
    p_user_id: userId,
    p_year: year,
    p_month: month
  });

  if (error) throw error;
  return data;
}
```

Сейчас код использует обычные SELECT запросы которые тоже работают хорошо благодаря индексам.

## 4️⃣ Ожидаемые улучшения производительности

| Метрика | До | После |
|---------|----|----|
| **Первая загрузка** | 3-5 сек | 500мс - 1сек |
| **Переключение месяца** | 2-3 сек | 0мс (из кеша) |
| **Запросы при старте** | 10+ (N+1) | 3-4 (batch) |
| **Для 30 тренировок/месяц** | ❌ Перегруз | ✅ 1 batch запрос |

## 🔗 Источники

- **Supabase RPC**: https://supabase.com/docs/guides/database/functions
- **PostgreSQL Indexes**: https://www.postgresql.org/docs/current/indexes.html
- **TanStack Query Prefetch**: https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
- **React Query Best Practices**: https://tkdodo.eu/blog/react-query-as-a-state-manager

## ⚠️ Важные замечания

- Индексы занимают дополнительное место в БД (~5-10 MB)
- Индексы ускоряют SELECT но замедляют INSERT/UPDATE на ~2%
- Для большинства приложений это компромисс стоит того
- RPC функция опциональна - текущий SELECT код работает хорошо

## 🐛 Решение проблем

**Q: Ошибка "function get_month_workouts does not exist"**
- A: Скрипт `create_rpc_get_month_workouts.sql` не был выполнен
- Решение: Выполнить скрипт в Supabase SQL Editor

**Q: Индексы не работают / запросы все еще медленные**
- A: PostgreSQL не обновил статистику
- Решение: Выполнить `ANALYZE;` в SQL Editor

**Q: Я удалил индекс случайно**
- A: Выполните еще раз скрипт `add_performance_indexes.sql`

---

**Status**: ✅ Готово к применению
**Created**: 2025-11-12
**For**: Super Strong project
