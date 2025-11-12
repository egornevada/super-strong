# Стратегия Асинхронной Загрузки для Super Strong

> Документ содержит четкий план загрузки данных для приложения с учетом спортсменов, тренирующихся каждый день.

---

## 📋 ТЕКУЩАЯ ПРОБЛЕМА

- ❌ Приложение ждет загрузки ВСЕ данных перед рендером
- ❌ Нет приоритизации: текущий месяц = соседние месяцы
- ❌ Тренировки загружаются отдельно от статистики (2+ запроса)
- ❌ Нет предзагрузки при переключении месяцев
- ❌ Упражнения загружаются непредсказуемо

---

## ⚡ НОВАЯ СТРАТЕГИЯ (4 ЭТАПА)

### Этап 1: Инициализация (0-500мс)
**Цель**: Показать приложение пользователю

📖 **Источник**: https://tanstack.com/query/latest/docs/framework/react/guides/queries

```typescript
// App.tsx - ТОЛЬКО BATCH запрос текущего месяца
const { data: currentMonth } = useQuery({
  queryKey: ['workouts-month', year, month],
  queryFn: async () => {
    // ✅ Один batch запрос к Supabase:
    // 1. Получаем все тренировки за месяц
    // 2. Получаем статистику для каждого дня
    // 3. В одном запросе через JOIN или RPC
    return supabase
      .from('workout_sessions')
      .select(`
        *,
        statistics:workout_statistics(*)
      `)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)
      .order('created_at', { ascending: false })
  },
  staleTime: 1000 * 60 * 5 // 5 минут
})
```

📚 **Supabase Select**: https://supabase.com/docs/reference/javascript/select

**Результат**: Пользователь видит календарь с текущим месяцем за 500мс

---

### Этап 2: Соседние Месяцы (500мс-2s)
**Цель**: Подготовить соседние месяцы перед переключением

📖 **Источник (useQueries)**: https://tanstack.com/query/latest/docs/framework/react/reference/useQueries

```typescript
// CalendarPage.tsx - Параллельная загрузка 3 месяцев
const monthQueries = useQueries({
  queries: [
    // Текущий месяц (уже загружен на этапе 1)
    { queryKey: ['workouts-month', year, month], ... },
    // Предыдущий месяц
    { queryKey: ['workouts-month', year, month - 1],
      queryFn: () => fetchMonthWorkouts(year, month - 1),
      staleTime: 1000 * 60 * 5,
    },
    // Следующий месяц
    { queryKey: ['workouts-month', year, month + 1],
      queryFn: () => fetchMonthWorkouts(year, month + 1),
      staleTime: 1000 * 60 * 5,
    },
  ],
})

// При наведении на кнопку переключения - prefetch дальше
const onMouseEnterNextMonth = () => {
  queryClient.prefetchQuery({
    queryKey: ['workouts-month', year, month + 2],
    queryFn: () => fetchMonthWorkouts(year, month + 2),
  })
}
```

📚 **Prefetch документация**: https://tanstack.com/query/latest/docs/framework/react/guides/prefetching

**Результат**: Мгновенное переключение между месяцами (из кеша)

---

### Этап 3: Детали Упражнений (2s-3s)
**Цель**: Загрузить все упражнения из текущего месяца

📖 **Источник (enabled)**: https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries

```typescript
// После загрузки тренировок текущего месяца
const { data: allExercisesCurrentMonth } = useQuery({
  queryKey: ['exercises-month', year, month],
  queryFn: async () => {
    // Batch запрос: все упражнения за месяц в один запрос
    return supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercises(*),
        sets:workout_sets(*)
      `)
      .in('session_id', currentMonth.map(w => w.id)) // ← Все упражнения текущего месяца
      .order('created_at', { ascending: false })
  },
  enabled: !!currentMonth?.length, // Только после загрузки тренировок
  staleTime: 1000 * 60 * 5,
})
```

📚 **Supabase in() фильтр**: https://supabase.com/docs/reference/javascript/in

**Результат**: Полные данные для карточек упражнений

---

### Этап 4: Smart Prefetch (3s+)
**Цель**: Предзагрузить упражнения соседних месяцев при открытии детальной страницы

📖 **Источник (prefetchQuery)**: https://tanstack.com/query/latest/docs/framework/react/reference/useQueryClient#queryclientprefetchquery

```typescript
// DayDetailPage.tsx - При открытии
const prefetchExercisesForAdjacentMonths = () => {
  [prevMonth, nextMonth].forEach(month => {
    queryClient.prefetchQuery({
      queryKey: ['exercises-month', month.year, month.month],
      queryFn: () => fetchMonthExercises(month.year, month.month),
    })
  })
}
```

**Результат**: Соседние месяцы готовы при переключении

---

## 🔧 УЛУЧШЕНИЯ ПРИЛОЖЕНИЯ (React)

### 1. Создать хук `useMonthWorkouts`

📖 **Источник (useQuery)**: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

```typescript
// src/hooks/useMonthWorkouts.ts
export function useMonthWorkouts(year: number, month: number) {
  return useQuery({
    queryKey: ['workouts-month', year, month],
    queryFn: () => fetchMonthWithStatistics(year, month),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10, // Хранить в памяти 10 минут (garbage collect)
  })
}

// Использование везде:
const { data: workouts } = useMonthWorkouts(2025, 11)
```

💡 **gcTime** (ранее cacheTime) - данные остаются в памяти 10 минут, даже если они не нужны

### 2. Добавить Prefetch при Навигации

📖 **Источник (useQueryClient)**: https://tanstack.com/query/latest/docs/framework/react/reference/useQueryClient

```typescript
// Router/Navigation обработчик
const onNavigateToMonth = (year: number, month: number) => {
  // Предзагрузить ТРИ месяца: текущий + соседние
  [month - 1, month, month + 1].forEach(m => {
    queryClient.prefetchQuery({
      queryKey: ['workouts-month', year, m],
      queryFn: () => fetchMonthWorkouts(year, m),
    })
  })
  setCurrentMonth(month)
}
```

### 3. Optimize Query Keys

📖 **Источник (Query Keys Best Practices)**: https://tkdodo.eu/blog/react-query-as-a-state-manager#storing-non-server-state

```typescript
// ❌ Старый подход
['workouts', userId, year, month]

// ✅ Новый подход (группировка)
['workouts-month', year, month]      // Тренировки за месяц
['exercises-month', year, month]     // Упражнения за месяц
['exercise', exerciseId]             // Отдельное упражнение
['statistics', workoutId]            // Статистика тренировки
```

💡 **Иерархический подход** - облегчает инвалидацию (invalidate все для месяца одной командой)

---

## 🗄️ УЛУЧШЕНИЯ SUPABASE

### 1. Создать RPC функцию `get_month_workouts`

📖 **Источник (Supabase RPC)**: https://supabase.com/docs/guides/database/functions

```sql
CREATE OR REPLACE FUNCTION get_month_workouts(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  created_at TIMESTAMP,
  exercises_count INT,
  total_sets INT,
  statistics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.id,
    ws.user_id,
    ws.created_at,
    COUNT(DISTINCT we.id)::INT as exercises_count,
    COUNT(DISTINCT wset.id)::INT as total_sets,
    jsonb_build_object(
      'total_volume', SUM(wset.weight * wset.reps),
      'avg_duration', AVG(EXTRACT(EPOCH FROM (ws.updated_at - ws.created_at)))
    ) as statistics
  FROM workout_sessions ws
  LEFT JOIN workout_exercises we ON ws.id = we.session_id
  LEFT JOIN workout_sets wset ON we.id = wset.exercise_id
  WHERE ws.user_id = p_user_id
    AND EXTRACT(YEAR FROM ws.created_at) = p_year
    AND EXTRACT(MONTH FROM ws.created_at) = p_month
  GROUP BY ws.id, ws.user_id, ws.created_at
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

📚 **Использование RPC в JavaScript**:
```typescript
const { data } = await supabase.rpc('get_month_workouts', {
  p_year: 2025,
  p_month: 11
})
```

### 2. Индексы для быстрого фильтра

📖 **Источник (PostgreSQL Indexes)**: https://www.postgresql.org/docs/current/indexes.html

```sql
-- Индекс для быстрого поиска по месяцу
CREATE INDEX idx_workout_sessions_month
  ON workout_sessions(user_id, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at));

-- Индекс для упражнений текущего месяца
CREATE INDEX idx_workout_exercises_session
  ON workout_exercises(session_id);

-- Индекс для статистики
CREATE INDEX idx_workout_statistics_session
  ON workout_statistics(workout_session_id);
```

### 3. Batch Select Query (вместо RPC)

📖 **Источник (Supabase Relationships)**: https://supabase.com/docs/guides/api/joins-and-nesting

📚 **Источник (select с вложением)**: https://supabase.com/docs/reference/javascript/select

```typescript
// Если RPC не подходит, используем batch:
const { data } = await supabase
  .from('workout_sessions')
  .select(`
    id,
    created_at,
    user_id,
    exercises:workout_exercises(
      id,
      name,
      sets:workout_sets(
        id,
        weight,
        reps,
        order
      )
    ),
    statistics:workout_statistics(
      total_volume,
      duration,
      calories
    )
  `)
  .eq('user_id', userId)
  .gte('created_at', monthStart)
  .lte('created_at', monthEnd)
  .order('created_at', { ascending: false })
```

---

## 📊 СРАВНЕНИЕ: БЫЛО vs БУДЕТ

| Метрика | Было | Будет |
|---------|------|-------|
| **Первая загрузка** | 3-5 сек (ждет всех) | 500мс (только текущий месяц) |
| **Переключение месяца** | 2-3 сек (загрузка) | 0мс (из кеша) |
| **Открытие деталей** | 1-2 сек (ждет данные) | Мгновенно (уже загружены) |
| **Запросов при старте** | 10+ (все независимо) | 3-4 (batch + prefetch) |
| **Для спортсмена с 30 тренировок/мес** | ❌ Перегруз | ✅ 1 batch запрос |

---

## 🎯 ПЛАН РЕАЛИЗАЦИИ (ВРЕМЯ)

| Задача | Время | Файлы |
|--------|-------|-------|
| 1. Создать `useMonthWorkouts` хук | 15 мин | `src/hooks/useMonthWorkouts.ts` |
| 2. Создать RPC функцию в Supabase | 20 мин | Supabase console |
| 3. Обновить CalendarPage с prefetch | 30 мин | `src/pages/CalendarPage.tsx` |
| 4. Обновить DayDetailPage для соседних месяцев | 20 мин | `src/pages/DayDetailPage.tsx` |
| 5. Добавить индексы в Supabase | 10 мин | Supabase console |
| 6. Тестирование в DevTools | 30 мин | Network tab |
| **Итого** | **2 часа** | |

---

## 🔗 ИСТОЧНИКИ

- **TanStack Query Parallel Queries**: https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries
- **TanStack Query Prefetch**: https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
- **Supabase Select with Relations**: https://supabase.com/docs/reference/javascript/select
- **Supabase RPC**: https://supabase.com/docs/guides/database/functions
- **PostgreSQL Indexes**: https://www.postgresql.org/docs/current/indexes.html
- **React Query Best Practices**: https://tkdodo.eu/blog/react-query-as-a-state-manager

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

✅ Спортсмены с 30+ тренировками в месяц будут загружаться БЕЗ ЗАДЕРЖКИ (один batch запрос)

✅ Кэширование на 5 минут - пользователь увидит свежие данные

✅ Prefetch соседних месяцев - мгновенная навигация

✅ Индексы в БД - быстрый поиск (даже для большого стола)

❗ Нужна RPC функция или хотя бы Select с JOIN для batch загрузки

❗ Убедись что React Query уже установлен (`pnpm list @tanstack/react-query`)

---

**Статус**: 📋 ГОТОВО К РЕАЛИЗАЦИИ
**Создано**: 2025-11-12
**Автор**: Claude Code
**Проект**: Super Strong
