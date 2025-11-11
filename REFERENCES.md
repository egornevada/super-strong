# Проверенные Источники для Реализации

> Этот файл содержит РЕАЛЬНЫЕ источники и паттерны. НЕ ГАЛЮЦИНАЦИИ!
> Все примеры взяты из официальной документации или проверенных статей.

---

## 📚 ОФИЦИАЛЬНАЯ ДОКУМЕНТАЦИЯ

### 1. React useOptimistic Hook
**📖 Источник**: https://react.dev/reference/react/useOptimistic
**Статус**: ✅ ОФИЦИАЛЬНО (React 19+)

**Что это**:
> "Let you show a different state while an async action is underway."

**Когда использовать**:
- Когда нужен мгновенный UI feedback
- Форма отправляется - текст сразу виден
- Удаление - элемент сразу исчезает
- Создание - новый элемент сразу появляется

**Базовый паттерн**:
```typescript
const [optimisticState, addOptimistic] = useOptimistic(state, (currentState, optimisticValue) => {
  return {
    ...currentState,
    items: currentState.items.filter(item => item.id !== optimisticValue)
  };
});
```

**Ограничения**:
- Не общается с сервером (чисто UI)
- Для сервера нужна отдельная мутация
- Идеален для одного места на экране

---

### 2. React Query - Optimistic Updates
**📖 Источник**: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
**Статус**: ✅ ОФИЦИАЛЬНО (TanStack Query v5)

**Два подхода**:

#### Подход 1: UI-Based (ПРОЩЕ) ⭐ РЕКОМЕНДУЕТСЯ
```typescript
const { isPending, variables, mutate } = useMutation({
  mutationFn: deleteWorkout,
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
});

// В компоненте:
{isPending && <div>Удаляется...</div>}
<button onClick={() => mutate(workoutId)}>Удалить</button>
```

**Плюсы**:
- Простой код
- Нет race conditions
- Автоматический rollback на ошибку

**Минусы**:
- Нужно вручную отображать статус

#### Подход 2: Cache-Based (СЛОЖНЕЕ)
```typescript
useMutation({
  mutationFn: deleteWorkout,
  onMutate: async (workoutId) => {
    // Отмена любых pending запросов
    await queryClient.cancelQueries({ queryKey: ['workouts'] });

    // Сохраняем старые данные
    const previousWorkouts = queryClient.getQueryData(['workouts']);

    // Обновляем кэш оптимистически
    queryClient.setQueryData(['workouts'], (old) =>
      old.filter(w => w.id !== workoutId)
    );

    // Возвращаем для rollback
    return { previousWorkouts };
  },
  onError: (err, newWorkout, context) => {
    // Откатываем кэш на ошибку
    queryClient.setQueryData(['workouts'], context.previousWorkouts);
  },
  onSuccess: () => {
    // Перезагружаем все
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
  },
});
```

**Плюсы**:
- Автоматический UI update везде
- Не нужно вручную управлять состоянием

**Минусы**:
- Больше кода
- Сложнее отлаживать race conditions

**ВЫВОД**: Для вашего случая используем **Подход 1** (UI-Based) - проще и надежнее!

---

### 3. HTTP ETag и Optimistic Concurrency Control
**📖 Источник**: https://event-driven.io/en/how_to_use_etag_header_for_optimistic_concurrency/
**📖 Источник**: https://fideloper.com/etags-and-optimistic-concurrency-control
**Статус**: ✅ HTTP Standard (RFC 7232)

**Что это**:
> "Optimistic concurrency control forbids concurrent updates: if the resource you want to update has already been modified since you last read it, your update is rejected."

**Как использовать**:

1. **GET запрос** (получаем ресурс с ETag):
```
GET /api/workouts/abc123
HTTP/1.1 200 OK
ETag: "abc123def456"
Content-Type: application/json

{
  "id": "abc123",
  "name": "Тренировка",
  ...
}
```

2. **DELETE с If-Match** (отправляем с ETag):
```
DELETE /api/workouts/abc123
If-Match: "abc123def456"

HTTP/1.1 200 OK (успех)
или
HTTP/1.1 412 Precondition Failed (конфликт - нужно обновить локальную копию)
```

**Когда используется**:
- ✅ Google Calendar (при редактировании события)
- ✅ GitHub (при обновлении issue)
- ✅ AWS (S3 объекты)
- ✅ Stripe API

**ВЫВОД**: ETags нужны только если планируем конфликт-контроль. Для простого удаления можно без них начать.

---

## 💻 СТАНДАРТНЫЕ ПАТТЕРНЫ

### Паттерн 1: Optimistic Delete (САМЫЙ ПРОСТОЙ)

**Используем**:
- React `useOptimistic` (из React 19+)
- React Query `useMutation`
- Supabase `deleteWorkoutSessionWithExercises`

**Код**:
```typescript
// src/hooks/useOptimisticDelete.ts

import { useOptimistic } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteWorkoutSessionWithExercises } from '../services/workoutsApi';

export function useOptimisticWorkoutDelete() {
  const queryClient = useQueryClient();

  // useMutation для реального API запроса
  const mutation = useMutation({
    mutationFn: deleteWorkoutSessionWithExercises,
    onSuccess: () => {
      // Перезагружаем соответствующие запросы
      queryClient.invalidateQueries({ queryKey: ['workoutDays'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      // UI откатится автоматически через useOptimistic
    }
  });

  return mutation;
}
```

**В компоненте**:
```typescript
// src/pages/DayDetailPage.tsx

export function DayDetailPage({ sessions, ...props }) {
  const [optimisticSessions, removeOptimisticSession] = useOptimistic(
    sessions,
    (state, sessionId) => {
      return state.filter(s => s.id !== sessionId);
    }
  );

  const deleteWorkoutMutation = useOptimisticWorkoutDelete();

  const handleDelete = async (sessionId: string) => {
    // 1. UI обновляется СРАЗУ (0мс)
    removeOptimisticSession(sessionId);

    // 2. Отправляем запрос в фоне
    deleteWorkoutMutation.mutate(sessionId);
  };

  return (
    <div>
      {optimisticSessions.map(session => (
        <SessionCard
          key={session.id}
          session={session}
          onDelete={handleDelete}
          isDeleting={deleteWorkoutMutation.isPending &&
                      deleteWorkoutMutation.variables === session.id}
        />
      ))}
    </div>
  );
}
```

**Результат**:
- ✅ Тренировка удаляется с экрана сразу
- ✅ Статистика и календарь обновляются после успеха
- ✅ Если ошибка - тренировка вернется на место
- ✅ Пользователь видит "Удаляется..." статус

---

## 🔧 SUPABASE ИНТЕГРАЦИЯ

### Dokumentación Supabase для Delete
**📖 Источник**: https://supabase.com/docs/reference/javascript/delete

**Простой DELETE**:
```typescript
const { error } = await supabase
  .from('workouts')
  .delete()
  .eq('id', workoutId);
```

**ВАЖНО**: Supabase поддерживает RPC (stored procedures):
```typescript
const { data, error } = await supabase.rpc('delete_workout_cascade', {
  p_workout_id: workoutId,
  p_user_id: userId
});
```

**Таблицы нужны в БД**:
- `workouts` (с полем `deleted_at` для soft delete)
- `workout_exercises`
- `workout_sets`

---

## 📊 СРАВНЕНИЕ ПОДХОДОВ

| Подход | Сложность | Скорость | Надежность | Рекомендуется |
|--------|-----------|----------|-----------|---------------|
| **Optimistic Update** | ⭐ Простая | ⭐⭐⭐⭐⭐ Мгновенна | ⭐⭐⭐⭐ Хорошо | ✅ ДА |
| **Full Refetch** | ⭐ Простая | ⭐⭐ Медленно | ⭐⭐⭐⭐⭐ Идеально | ❌ НЕТ |
| **Incremental Sync** | ⭐⭐⭐ Сложная | ⭐⭐⭐⭐ Хорошо | ⭐⭐⭐⭐⭐ Идеально | ⏳ ПОЗЖЕ |
| **WebSocket Real-time** | ⭐⭐⭐⭐ Очень сложная | ⭐⭐⭐⭐⭐ Идеально | ⭐⭐⭐⭐ Хорошо | ⏳ ПОЗЖЕ |

---

## 🚀 ПЛАН РЕАЛИЗАЦИИ (С ИСТОЧНИКАМИ)

### День 1: Базовая Оптимистическая Удаление

1. **Установить React Query** (если нет)
   ```bash
   npm install @tanstack/react-query
   ```
   📖 Источник: https://tanstack.com/query/latest

2. **Создать hook `useOptimisticWorkoutDelete`**
   - Использовать `useMutation` из React Query
   - Обновлять `queryClient` на успех
   📖 Источник: https://react.dev/reference/react/useOptimistic

3. **Использовать в `DayDetailPage`**
   - Применить `useOptimistic` для UI
   - Вызвать мутацию при удалении
   📖 Источник: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates

4. **Тестировать**
   - Удалить тренировку → сразу исчезает
   - Открыть dev tools → видим запрос на сервер
   - Проверить статистика обновляется

### День 2+: Оптимизация (если нужно)

- Добавить ETag для конфликт-контроля (⏳ позже)
- Добавить retry logic (⏳ позже)
- Добавить WebSocket real-time sync (⏳ позже)

---

## ✅ ЧЕКЛИСТ РЕАЛИЗАЦИИ

- [ ] Прочитать React useOptimistic docs
- [ ] Прочитать React Query Optimistic Updates docs
- [ ] Установить React Query (если нет)
- [ ] Создать hook useOptimisticWorkoutDelete
- [ ] Обновить DayDetailPage
- [ ] Тестировать удаление
- [ ] Убедиться что статистика обновляется
- [ ] Убедиться что календарь обновляется
- [ ] ✅ ГОТОВО!

---

## 🔗 БЫСТРЫЕ ССЫЛКИ

| Ресурс | Ссылка |
|--------|--------|
| React useOptimistic | https://react.dev/reference/react/useOptimistic |
| React Query Mutations | https://tanstack.com/query/latest/docs/framework/react/guides/mutations |
| React Query Optimistic | https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates |
| Supabase Delete | https://supabase.com/docs/reference/javascript/delete |
| Supabase RPC | https://supabase.com/docs/reference/javascript/rpc |
| ETag Best Practices | https://event-driven.io/en/how_to_use_etag_header_for_optimistic_concurrency/ |
| HTTP Concurrency Control | https://fideloper.com/etags-and-optimistic-concurrency-control |
| Kent C. Dodds - useOptimistic | https://www.epicreact.dev/use-optimistic-to-make-your-app-feel-instant-zvyuv |

---

## 📝 ПРИМЕЧАНИЯ ДЛЯ CLAUDE CODE

**КОГДА ПИСАТЬ КОД**:
- ✅ Ссылаюсь на этот файл: "Согласно REFERENCES.md..."
- ✅ Использую примеры из официальной документации
- ✅ Говорю "проверено в React docs", "из TanStack Query", и т.д.

**КОГДА НЕ ПИСАТЬ КОД**:
- ❌ Не добавляю неподтвержденные функции (например, webhook notifications без доказательств)
- ❌ Не усложняю если есть простое решение
- ❌ Не говорю "похоже работает так" - проверяю источники

**ЕСЛИ НЕ УВЕРЕН**:
- 🔍 Ищу в этом файле
- 📚 Если нет - ищу в официальной документации (React, React Query, Supabase)
- 🚫 Если все равно нет - говорю "не уверен, нужно проверить" вместо галюцинации

