# Идеальная Архитектура Синхронизации - Super Strong

> Основано на анализе архитектуры Google Calendar. Фокус на **реал-тайм синхронизацию между веб и мобильной версией** без оффлайн режима.

## Проблема Текущей Архитектуры

### Текущие Проблемы
1. ❌ **Синхронные операции удаления** - UI блокируется во время удаления
2. ❌ **Нет оптимистических обновлений** - UI ждет ответа сервера
3. ❌ **Отсутствует очередь операций** - При сбое сети теряются изменения
4. ❌ **Нет механизма повтора** - Если запрос упал, пользователь не узнает
5. ❌ **Рассинхронизация состояния** - Браузер не знает о изменениях с мобильного

### Почему Google Calendar Работает Быстро и Четко
- ✅ **Оптимистические обновления** - UI обновляется мгновенно
- ✅ **Real-time push notifications** - Сервер уведомляет клиента об изменениях
- ✅ **Incremental sync** - Синхронизируются только измененные данные
- ✅ **Robustly queued operations** - Операции сохраняются и повторяются
- ✅ **Conflict detection** - Предотвращение потери данных через ETags
- ✅ **Exponential backoff** - Умный retry механизм

---

## Идеальная Архитектура для Super Strong

### Диаграмма Потока Данных

```
┌─────────────────────────────────────────────────────────────┐
│                  WEB CLIENT (React)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ User Interface (Calendar, TrackCard, SessionCard)       ││
│  │ - Optimistic updates: мгновенное обновление             ││
│  │ - Shows pending state (иконка загрузки)                 ││
│  └──────────┬──────────────────────────────────────────────┘│
│             │                                                │
│  ┌──────────▼──────────────────────────────────────────────┐│
│  │ Local State & Cache (React Query / TanStack Query)      ││
│  │ - Cached workout sessions                               ││
│  │ - Cached exercises                                       ││
│  │ - Pending operations queue (in-memory)                  ││
│  └──────────┬──────────────────────────────────────────────┘│
│             │                                                │
│  ┌──────────▼──────────────────────────────────────────────┐│
│  │ API Client (with automatic retry & sync)                ││
│  │ - Optimistic mutations                                   ││
│  │ - Automatic exponential backoff                          ││
│  │ - ETag-based conflict detection                          ││
│  │ - Sync token management                                  ││
│  └──────────┬──────────────────────────────────────────────┘│
└─────────────┼─────────────────────────────────────────────────┘
              │ HTTPS REST API
              │
┌─────────────▼─────────────────────────────────────────────────┐
│                BACKEND (Supabase/Node.js)                     │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ REST Endpoints                                         │  │
│  │ - POST /api/workouts (create)                          │  │
│  │ - PUT /api/workouts/:id (update)                       │  │
│  │ - DELETE /api/workouts/:id (delete)                    │  │
│  │ - GET /api/workouts?syncToken=X (incremental sync)     │  │
│  │ - POST /api/sync/channel (webhook registration)        │  │
│  └───────┬───────────────────────────────────────────────┘  │
│          │                                                   │
│  ┌───────▼───────────────────────────────────────────────┐  │
│  │ Database (PostgreSQL)                                 │  │
│  │ - Workouts (+ etag, sync_token)                        │  │
│  │ - Exercises (+ etag)                                   │  │
│  │ - Sets (+ etag)                                        │  │
│  │ - Change Log (для sync tokens)                         │  │
│  │ - Webhook Channels (+ expiration)                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Real-Time System                                       │  │
│  │ - Webhook push notifications (POST to client)          │  │
│  │ - Change detection (on INSERT/UPDATE/DELETE)           │  │
│  │ - Exponential backoff for failed webhooks              │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
              △
              │ Webhook Push (server → client)
              │
       ┌──────┴────────┐
       │               │
  ┌────▼─────┐   ┌────▼─────┐
  │  Web App  │   │  Mobile   │
  │  Browser  │   │   App     │
  └───────────┘   └───────────┘
       │               │
       └───────┬───────┘
               │ Real-time sync
               │
           All in sync! ✅
```

---

## 1. API Контрактный Дизайн (REST)

### 1.1 Создание Тренировки (Optimistic Update)

**Запрос**:
```http
POST /api/workouts
Content-Type: application/json

{
  "user_id": "user-123",
  "day_id": "day-2025-11-10",
  "started_at": "2025-11-10T14:30:00Z",
  "exercises": [
    {
      "exercise_id": "ex-1",
      "sets": [
        { "reps": 10, "weight": 50 },
        { "reps": 8, "weight": 55 }
      ]
    }
  ]
}
```

**Ответ (201 Created)**:
```json
{
  "id": "workout-abc123",
  "user_id": "user-123",
  "day_id": "day-2025-11-10",
  "started_at": "2025-11-10T14:30:00Z",
  "exercises": [...],
  "created_at": "2025-11-10T14:30:05Z",
  "updated_at": "2025-11-10T14:30:05Z",
  "etag": "abc123def456",
  "sync_token": "CPDAlvWDx70CGAU="
}
```

### 1.2 Удаление Тренировки (Optimistic Delete)

**Запрос**:
```http
DELETE /api/workouts/workout-abc123
If-Match: abc123def456
```

**Ответ (200 OK)**:
```json
{
  "success": true,
  "deleted_id": "workout-abc123",
  "sync_token": "CPDAlvWDx70CGAU=",
  "timestamp": "2025-11-10T14:35:00Z"
}
```

### 1.3 Incremental Sync (только измененные данные)

**Запрос**:
```http
GET /api/workouts?syncToken=CPDAlvWDx70CGAU=&showDeleted=true
```

**Ответ (200 OK)**:
```json
{
  "items": [
    {
      "id": "workout-xyz789",
      "status": "active",
      "data": { ... }
    },
    {
      "id": "workout-old123",
      "status": "deleted",
      "deleted_at": "2025-11-10T14:35:00Z"
    }
  ],
  "nextSyncToken": "CPDAlvWDx70CGAU=",
  "pageToken": null
}
```

### 1.4 Webhook Channel Registration

**Запрос**:
```http
POST /api/sync/channel
Content-Type: application/json

{
  "id": "web-channel-uuid-here",
  "type": "webhook",
  "address": "https://your-app.com/api/webhooks/calendar"
}
```

**Ответ (200 OK)**:
```json
{
  "id": "web-channel-uuid-here",
  "resourceId": "server-generated-id",
  "resourceUri": "/workouts",
  "expiration": 1699680000000,
  "sync_token": "CPDAlvWDx70CGAU="
}
```

### 1.5 Webhook Notification (из сервера в браузер)

```http
POST https://your-app.com/api/webhooks/calendar HTTP/1.1

X-Goog-Resource-State: exists
X-Goog-Channel-ID: web-channel-uuid-here
X-Goog-Message-Number: 1
X-Goog-Resource-ID: workout-abc123
X-Goog-Delivery-Time: 2025-11-10T14:35:01Z

(no body)
```

---

## 2. Реализация на Frontend (React + TypeScript)

### 2.1 Optimistic Mutation Hook (React Query)

```typescript
// src/hooks/useOptimisticWorkoutDelete.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '../services/workoutsApi';
import { logger } from '../lib/logger';

interface OptimisticMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useOptimisticWorkoutDelete(options?: OptimisticMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId: string) => {
      logger.info('Deleting workout', { workoutId });
      return await workoutsApi.deleteWorkout(workoutId);
    },

    // OPTIMISTIC UPDATE: обновляем UI ДО ответа сервера
    onMutate: async (workoutId: string) => {
      // 1. Отменяем любые outgoing refetch'и
      await queryClient.cancelQueries({ queryKey: ['workouts'] });

      // 2. Сохраняем текущее состояние для rollback
      const previousWorkouts = queryClient.getQueryData(['workouts']);

      // 3. Оптимистически обновляем кэш
      // Удаляем из списка, но UI остается отзывчивым
      queryClient.setQueryData(['workouts'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((w: any) => w.id !== workoutId),
        };
      });

      // 4. Возвращаем функцию для rollback
      return { previousWorkouts, workoutId };
    },

    // Если успешно - синхронизируем с новым sync token
    onSuccess: (response) => {
      logger.info('Workout deleted successfully', { workoutId: response.deleted_id });

      // Сохраняем новый sync token
      localStorage.setItem('workoutSyncToken', response.sync_token);

      // Обновляем статистику и календарь
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['workoutDays'] });

      options?.onSuccess?.();
    },

    // Если ошибка - откатываем изменения
    onError: (error, _workoutId, context: any) => {
      logger.error('Failed to delete workout', { error, workoutId: _workoutId });

      // Rollback UI
      if (context?.previousWorkouts) {
        queryClient.setQueryData(['workouts'], context.previousWorkouts);
      }

      options?.onError?.(error as Error);
    },
  });
}
```

### 2.2 Использование в Component

```typescript
// src/pages/DayDetailPage.tsx

import { DayDetailPageProps } from './types';
import { useOptimisticWorkoutDelete } from '../hooks/useOptimisticWorkoutDelete';
import { logger } from '../lib/logger';

export function DayDetailPage({
  userDayId,
  date,
  onWorkoutDeleted,
  onBack,
  onStartNewWorkout,
  onOpenWorkout,
}: DayDetailPageProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSessionForDelete, setSelectedSessionForDelete] =
    useState<WorkoutSession | null>(null);

  // Используем оптимистическую мутацию
  const deleteWorkoutMutation = useOptimisticWorkoutDelete({
    onSuccess: () => {
      setDeleteModalOpen(false);
      setSelectedSessionForDelete(null);
      // Родитель будет уведомлен через invalidateQueries
      onWorkoutDeleted?.();
    },
    onError: (error) => {
      logger.error('Delete failed, showing error to user', { error });
      // Показываем ошибку пользователю
      showTelegramAlert('Ошибка удаления тренировки. Попробуйте еще раз.');
    },
  });

  const handleConfirmDelete = async () => {
    if (!selectedSessionForDelete) return;

    logger.info('User confirmed deletion', {
      sessionId: selectedSessionForDelete.id,
    });

    // mutate() триггирит оптимистический update
    deleteWorkoutMutation.mutate(selectedSessionForDelete.id);
  };

  return (
    <div className="w-full h-full flex flex-col bg-bg-1">
      {/* Header */}
      <div className="bg-bg-1">
        <HeaderWithBackButton backButtonLabel={dateLabel} onBack={onBack} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Sessions list or empty state */}
      </div>

      {/* Delete confirmation dialog */}
      {selectedSessionForDelete && (
        <AlertDialog
          isOpen={deleteModalOpen}
          title="Удалить тренировку?"
          message={`Тренировка будет удалена.`}
          isDangerous={true}
          confirmText={
            deleteWorkoutMutation.isPending ? 'Удаление...' : 'Удалить'
          }
          cancelText="Отмена"
          onConfirm={handleConfirmDelete}
          isLoading={deleteWorkoutMutation.isPending}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedSessionForDelete(null);
          }}
        />
      )}
    </div>
  );
}
```

### 2.3 API Client с Retry Logic

```typescript
// src/services/api.ts

interface FetchOptions extends RequestInit {
  retries?: number;
  backoffFactor?: number;
  maxBackoffDelay?: number;
}

export async function apiCall<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    retries = 3,
    backoffFactor = 2,
    maxBackoffDelay = 64000,
    ...fetchOptions
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      // Обработка статус кодов
      if (response.status === 410) {
        // Gone - sync token expired, need full sync
        logger.warn('Sync token expired (410 Gone)');
        localStorage.removeItem('workoutSyncToken');
        throw new Error('SYNC_TOKEN_EXPIRED');
      }

      if (response.status === 412) {
        // Conflict - ETag mismatch
        logger.warn('ETag conflict (412)');
        throw new Error('CONFLICT_DETECTED');
      }

      if (response.status === 429) {
        // Rate limited
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : null;
        throw new RateLimitError('Rate limited', delay);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (400-499)
      const isRetryable =
        !(error instanceof RateLimitError) &&
        !lastError.message.startsWith('HTTP 4');

      if (!isRetryable || attempt === retries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const baseDelay = Math.pow(backoffFactor, attempt) * 1000;
      const delay = Math.min(baseDelay, maxBackoffDelay);
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;

      logger.debug('Retrying API call', {
        url,
        attempt: attempt + 1,
        delayMs: totalDelay,
      });

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError!;
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

### 2.4 Webhook Listener и Sync Channel Management

```typescript
// src/services/webhookSync.ts

export class WebhookSyncService {
  private channelId: string;
  private resourceId: string;
  private syncToken: string | null;
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.channelId = this.generateChannelId();
    this.syncToken = localStorage.getItem('workoutSyncToken');
  }

  // Инициализировать webhook канал при загрузке приложения
  async initialize() {
    try {
      logger.info('Initializing webhook sync channel');

      // 1. Регистрируем webhook канал на сервере
      const channel = await apiCall('/api/sync/channel', {
        method: 'POST',
        body: JSON.stringify({
          id: this.channelId,
          type: 'webhook',
          address: `${window.location.origin}/api/webhooks/workouts`,
        }),
      });

      this.resourceId = channel.resourceId;
      this.syncToken = channel.sync_token;

      logger.info('Webhook channel registered', {
        channelId: this.channelId,
        resourceId: this.resourceId,
      });

      // 2. Запускаем периодическое обновление канала (перед истечением)
      this.startChannelRenewal(channel.expiration);

      // 3. Регистрируем обработчик для входящих уведомлений
      this.registerWebhookHandler();
    } catch (error) {
      logger.error('Failed to initialize webhook sync', { error });
      // Fallback к периодической синхронизации
      this.startPollingSync();
    }
  }

  // Обработчик входящих webhook уведомлений
  private registerWebhookHandler() {
    // В реальном приложении, это будет маршрут в Express/Supabase Functions
    window.addEventListener('webhook:workouts:changed', async () => {
      logger.info('Received webhook notification, performing incremental sync');
      await this.performIncrementalSync();
    });
  }

  // Incremental sync с использованием sync token
  private async performIncrementalSync() {
    try {
      const response = await apiCall(
        `/api/workouts?syncToken=${this.syncToken}&showDeleted=true`
      );

      // Применяем изменения к локальному кэшу
      response.items.forEach((item: any) => {
        if (item.status === 'deleted') {
          // Удаляем из кэша
          this.queryClient.setQueryData(['workouts'], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.filter((w: any) => w.id !== item.id),
            };
          });
        } else {
          // Обновляем или добавляем в кэш
          this.queryClient.setQueryData(['workouts'], (old: any) => {
            if (!old) return old;
            const itemIndex = old.items.findIndex((w: any) => w.id === item.id);
            if (itemIndex >= 0) {
              // Обновляем существующий
              const updated = [...old.items];
              updated[itemIndex] = item.data;
              return { ...old, items: updated };
            } else {
              // Добавляем новый
              return { ...old, items: [...old.items, item.data] };
            }
          });
        }
      });

      // Обновляем sync token для следующего синца
      this.syncToken = response.nextSyncToken;
      localStorage.setItem('workoutSyncToken', this.syncToken!);

      logger.info('Incremental sync completed', {
        itemsCount: response.items.length,
      });
    } catch (error) {
      logger.error('Incremental sync failed', { error });
      // Fallback к full sync при ошибке или истечении токена
      if ((error as Error).message === 'SYNC_TOKEN_EXPIRED') {
        await this.performFullSync();
      }
    }
  }

  // Full sync при инициализации или истечении токена
  private async performFullSync() {
    try {
      logger.info('Performing full sync');
      const workouts = await apiCall('/api/workouts');
      this.queryClient.setQueryData(['workouts'], workouts);
    } catch (error) {
      logger.error('Full sync failed', { error });
    }
  }

  // Fallback: периодический polling
  private startPollingSync() {
    logger.info('Starting polling sync (fallback mode)');
    setInterval(async () => {
      await this.performIncrementalSync();
    }, 30000); // каждые 30 секунд
  }

  // Обновление webhook канала перед истечением
  private startChannelRenewal(expirationTime: number) {
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;
    const renewalTime = timeUntilExpiration * 0.8; // Обновляем за 20% до истечения

    setTimeout(async () => {
      await this.initialize(); // Создаем новый канал
    }, renewalTime);
  }

  private generateChannelId(): string {
    return `web-${crypto.randomUUID()}`;
  }
}
```

### 2.5 Application Setup

```typescript
// src/App.tsx

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebhookSyncService } from './services/webhookSync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

function AppContent() {
  useEffect(() => {
    // Инициализировать webhook sync при загрузке приложения
    const syncService = new WebhookSyncService(queryClient);
    syncService.initialize();
  }, []);

  return (
    <div className="app">
      {/* Your app routes */}
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
```

---

## 3. Backend Implementation (Node.js + Supabase)

### 3.1 Database Schema с ETags и Sync Tokens

```sql
-- Таблица тренировок с ETag и sync token
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Для синхронизации
  etag TEXT NOT NULL DEFAULT MD5(NOW()::TEXT),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, day_id, started_at),
  INDEX idx_user_updated (user_id, updated_at),
  INDEX idx_user_deleted (user_id, deleted_at)
);

-- Таблица упражнений (связаны с тренировками)
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),

  etag TEXT NOT NULL DEFAULT MD5(NOW()::TEXT),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_workout_updated (workout_id, updated_at)
);

-- Таблица подходов
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight DECIMAL(5, 2) NOT NULL,

  etag TEXT NOT NULL DEFAULT MD5(NOW()::TEXT),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_exercise_updated (exercise_id, updated_at)
);

-- Таблица sync токенов (хранит информацию об изменениях)
CREATE TABLE sync_changes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'workout', 'exercise', 'set'
  resource_id UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_user_timestamp (user_id, timestamp)
);

-- Таблица webhook каналов
CREATE TABLE webhook_channels (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'workouts'
  webhook_address TEXT NOT NULL,
  resource_id TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_notification_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'failed'

  INDEX idx_user_expires (user_id, expires_at)
);
```

### 3.2 Эффективное удаление с каскадной очисткой

```typescript
// src/api/workouts.ts

import { supabase } from './supabaseClient';
import { generateETag, generateSyncToken } from '../lib/sync';

export async function deleteWorkoutCascade(
  workoutId: string,
  userId: string
) {
  const { data: workout, error: fetchError } = await supabase
    .from('workouts')
    .select('id, etag')
    .eq('id', workoutId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !workout) {
    throw new Error('Workout not found');
  }

  // Используем транзакцию для атомарного удаления
  const { error } = await supabase.rpc('delete_workout_cascade', {
    p_workout_id: workoutId,
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  // Возвращаем информацию об удалении и новый sync token
  return {
    deleted_id: workoutId,
    sync_token: generateSyncToken(),
    timestamp: new Date().toISOString(),
  };
}

// PostgreSQL RPC функция для каскадного удаления
const CASCADE_DELETE_SQL = `
CREATE OR REPLACE FUNCTION delete_workout_cascade(
  p_workout_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Используем транзакцию для атомарности
  -- 1. Помечаем все сеты упражнений как удаленные
  UPDATE workout_sets
  SET deleted_at = NOW(), etag = MD5(NOW()::TEXT)
  WHERE exercise_id IN (
    SELECT id FROM workout_exercises WHERE workout_id = p_workout_id
  );

  -- 2. Помечаем все упражнения как удаленные
  UPDATE workout_exercises
  SET deleted_at = NOW(), etag = MD5(NOW()::TEXT)
  WHERE workout_id = p_workout_id;

  -- 3. Помечаем саму тренировку как удаленную (soft delete)
  UPDATE workouts
  SET deleted_at = NOW(), etag = MD5(NOW()::TEXT)
  WHERE id = p_workout_id AND user_id = p_user_id;

  -- 4. Записываем в лог изменений для синхронизации
  INSERT INTO sync_changes (user_id, resource_type, resource_id, change_type, timestamp)
  VALUES
    (p_user_id, 'workout', p_workout_id, 'deleted', NOW());

END;
$$ LANGUAGE plpgsql;
`;
```

### 3.3 Webhook Push Service

```typescript
// src/services/webhookPush.ts

import axios from 'axios';
import { logger } from '../lib/logger';

export class WebhookPushService {
  async notifyWorkoutChange(
    userId: string,
    resourceId: string,
    changeType: 'created' | 'updated' | 'deleted'
  ) {
    // 1. Получаем все активные webhook каналы для этого пользователя
    const { data: channels } = await supabase
      .from('webhook_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_type', 'workouts')
      .eq('status', 'active')
      .gt('expires_at', new Date());

    if (!channels || channels.length === 0) {
      logger.debug('No active webhook channels for user', { userId });
      return;
    }

    // 2. Отправляем уведомление на каждый канал с retry logic
    for (const channel of channels) {
      await this.sendWebhookWithRetry(channel, resourceId, changeType);
    }
  }

  private async sendWebhookWithRetry(
    channel: any,
    resourceId: string,
    changeType: string,
    retries = 3,
    attempt = 0
  ) {
    try {
      // Отправляем заголовки (как Google Calendar)
      // Не отправляем данные в теле - клиент синхронизирует сам
      await axios.post(channel.webhook_address, null, {
        headers: {
          'X-Goog-Resource-State': changeType, // 'created', 'updated', 'deleted'
          'X-Goog-Channel-ID': channel.id,
          'X-Goog-Message-Number': Date.now(),
          'X-Goog-Resource-ID': resourceId,
          'X-Goog-Delivery-Time': new Date().toISOString(),
        },
        timeout: 5000,
      });

      // Обновляем time last notification
      await supabase
        .from('webhook_channels')
        .update({ last_notification_at: new Date() })
        .eq('id', channel.id);

      logger.info('Webhook notification sent', { channelId: channel.id });
    } catch (error) {
      logger.warn('Webhook notification failed', {
        channelId: channel.id,
        attempt: attempt + 1,
        error,
      });

      if (attempt < retries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendWebhookWithRetry(
          channel,
          resourceId,
          changeType,
          retries,
          attempt + 1
        );
      } else {
        // Помечаем канал как failed после всех повторов
        await supabase
          .from('webhook_channels')
          .update({ status: 'failed' })
          .eq('id', channel.id);
      }
    }
  }
}
```

### 3.4 Synchronization Token Generation

```typescript
// src/lib/sync.ts

import { supabase } from '../api/supabaseClient';

/**
 * Генерирует sync token для incremental sync
 * Основано на последнем изменении для пользователя
 */
export async function generateSyncToken(userId: string): Promise<string> {
  const { data } = await supabase
    .from('sync_changes')
    .select('id')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return 'INITIAL';
  }

  // Кодируем ID последнего изменения как sync token
  // В реальном приложении можно использовать base64
  const lastChangeId = data[0].id;
  return Buffer.from(lastChangeId.toString()).toString('base64');
}

/**
 * Декодирует sync token для получения изменений
 */
export async function decodeSyncToken(token: string): Promise<number> {
  if (token === 'INITIAL') {
    return 0;
  }
  return parseInt(Buffer.from(token, 'base64').toString('utf-8'));
}

/**
 * Получает изменения с момента последнего sync token
 */
export async function getChangesSinceToken(
  userId: string,
  syncToken: string,
  limit = 100
) {
  const lastChangeId = await decodeSyncToken(syncToken);

  const { data: changes } = await supabase
    .from('sync_changes')
    .select('*')
    .eq('user_id', userId)
    .gt('id', lastChangeId)
    .order('id', { ascending: true })
    .limit(limit);

  return changes || [];
}
```

### 3.5 API Endpoint для Incremental Sync

```typescript
// src/api/routes/workouts.ts

import express from 'express';
import { generateSyncToken, getChangesSinceToken } from '../lib/sync';

const router = express.Router();

/**
 * GET /api/workouts?syncToken=X&showDeleted=true
 * Incremental sync - получает только измененные данные
 */
router.get('/api/workouts', async (req, res) => {
  const userId = req.user.id;
  const { syncToken, showDeleted } = req.query;

  try {
    // 1. Получаем изменения
    const changes = await getChangesSinceToken(
      userId,
      syncToken as string || 'INITIAL'
    );

    // 2. Преобразуем changes в items для клиента
    const items = changes.map((change) => ({
      id: change.resource_id,
      status: change.change_type === 'deleted' ? 'deleted' : 'active',
      data: change.data,
      deleted_at: change.timestamp,
    }));

    // 3. Фильтруем удаленные если нужно
    const filteredItems = showDeleted
      ? items
      : items.filter((item) => item.status !== 'deleted');

    // 4. Генерируем новый sync token
    const nextSyncToken = await generateSyncToken(userId);

    res.json({
      items: filteredItems,
      nextSyncToken,
      pageToken: null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/workouts/:id
 * Удаление с проверкой ETag
 */
router.delete('/api/workouts/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ifMatch = req.headers['if-match'];

  try {
    // Получаем текущий ETag
    const { data: workout } = await supabase
      .from('workouts')
      .select('etag')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Проверяем ETag
    if (ifMatch && ifMatch !== workout.etag) {
      return res.status(412).json({ error: 'Precondition Failed: ETag mismatch' });
    }

    // Удаляем каскадно
    const result = await deleteWorkoutCascade(id, userId);

    // Уведомляем другие клиенты через webhook
    await webhookPushService.notifyWorkoutChange(userId, id, 'deleted');

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 4. Обработка Ошибок и Граничные Случаи

### 4.1 HTTP Status Codes

| Code | Ситуация | Действие Клиента |
|------|----------|------------------|
| **200** | Успех | Обновить кэш, сохранить sync token |
| **201** | Ресурс создан | Обновить кэш с новым ID |
| **204** | Успех (нет контента) | Подтвердить успех |
| **400** | Неверный запрос | Не повторять, показать ошибку |
| **401** | Не авторизован | Обновить токен OAuth или перезагрузить |
| **403** | Нет доступа | Не повторять, показать ошибку |
| **404** | Ресурс не найден | Удалить из кэша |
| **410** | Токен истек | Выполнить full sync, стереть кэш |
| **412** | Conflict (ETag) | Получить последнюю версию, попросить пользователя переделать |
| **429** | Rate limit | Exponential backoff с Retry-After |
| **500-503** | Ошибка сервера | Exponential backoff, повторить до 5 раз |

### 4.2 Обработка Race Conditions

```typescript
// Пример: пользователь удаляет тренировку на веб и мобильной одновременно

// ШАГ 1: Веб отправляет DELETE
// DELETE /api/workouts/abc123
// Мобильный в это же время отправляет:
// DELETE /api/workouts/abc123

// ШАГ 2: Первый запрос (от веб) успешен (200 OK)
// Сервер помечает как deleted_at = NOW()

// ШАГ 3: Второй запрос (от мобильного) получает:
// DELETE /api/workouts/abc123
// Если resource не найден → 404 (ожидается)

// ШАГ 4: Webhook сообщает обоим:
// X-Goog-Resource-State: deleted
// Оба клиента получают уведомление через incremental sync

// РЕЗУЛЬТАТ: Оба синхронизированы ✅
```

### 4.3 Разрешение Конфликтов

```typescript
// Сценарий: пользователь отредактировал тренировку в браузере и мобильном одновременно

// БРАУЗЕР отправляет:
PUT /api/workouts/abc123
If-Match: old-etag-123

// МОБИЛЬНЫЙ отправляет:
PUT /api/workouts/abc123
If-Match: old-etag-123

// БРАУЗЕР получает первым (200 OK):
{
  "id": "abc123",
  "etag": "new-etag-456",
  ...
}

// МОБИЛЬНЫЙ получает (412 Precondition Failed):
{
  "error": "ETag mismatch",
  "currentETag": "new-etag-456"
}

// МОБИЛЬНОЕ ДЕЙСТВИЕ:
// 1. Получить последнюю версию (текущий ETag: new-etag-456)
// 2. Слить изменения (если non-conflicting fields)
//    или показать UI для выбора пользователем
// 3. Повторить PUT с новым ETag

GET /api/workouts/abc123
// → returns latest with etag: new-etag-456

// Попытка слияния:
// Браузер изменил: name, exercises
// Мобильный изменил: notes
// → Слияние возможно (разные поля)

// Повторный PUT:
PUT /api/workouts/abc123
If-Match: new-etag-456
Body: { ...merged changes }
// → 200 OK с etag: merged-etag-789
```

---

## 5. Миграция с Текущей Архитектуры

### Фаза 1: Подготовка (1-2 дня)

```typescript
// 1. Добавить колонки в БД
ALTER TABLE workouts ADD COLUMN etag TEXT;
ALTER TABLE workouts ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE workout_exercises ADD COLUMN etag TEXT;
ALTER TABLE workout_exercises ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE workout_sets ADD COLUMN etag TEXT;
ALTER TABLE workout_sets ADD COLUMN deleted_at TIMESTAMP;

// 2. Инициализировать значения
UPDATE workouts SET etag = MD5(updated_at::TEXT) WHERE etag IS NULL;
UPDATE workout_exercises SET etag = MD5(updated_at::TEXT) WHERE etag IS NULL;
UPDATE workout_sets SET etag = MD5(updated_at::TEXT) WHERE etag IS NULL;

// 3. Создать таблицы sync_changes и webhook_channels
// (SQL выше)
```

### Фаза 2: Backend API (2-3 дня)

```typescript
// 1. Добавить cascade delete функцию (SQL выше)
// 2. Добавить sync endpoints (GET с syncToken)
// 3. Добавить webhook service
// 4. Обновить DELETE endpoint для проверки ETag
```

### Фаза 3: Frontend React Query (2-3 дня)

```typescript
// 1. Установить React Query
npm install @tanstack/react-query

// 2. Обернуть app в QueryClientProvider
// 3. Заменить ручное управление состоянием на useMutation
// 4. Добавить WebhookSyncService
// 5. Тестировать optimistic updates и rollback
```

### Фаза 4: Тестирование (1 день)

```typescript
// 1. Тесты для оптимистических обновлений
// 2. Тесты для конфликтов и retry logic
// 3. Тесты для incremental sync
// 4. E2E тесты с мобильным приложением
```

---

## 6. Мониторинг и Метрики

```typescript
// src/services/metrics.ts

export class SyncMetrics {
  static trackOperation(
    operation: 'create' | 'update' | 'delete',
    resource: 'workout' | 'exercise' | 'set',
    durationMs: number,
    success: boolean,
    errorCode?: string
  ) {
    // Отправить метрику в Analytics
    analytics.track('sync_operation', {
      operation,
      resource,
      duration_ms: durationMs,
      success,
      error_code: errorCode,
    });
  }

  static trackSyncToken(
    token: string,
    itemsCount: number,
    durationMs: number
  ) {
    analytics.track('incremental_sync', {
      sync_token: token.substring(0, 10) + '...', // без полного токена
      items_count: itemsCount,
      duration_ms: durationMs,
    });
  }

  static trackWebhookReceived(channelId: string, delayMs: number) {
    analytics.track('webhook_received', {
      channel_id: channelId,
      delay_ms: delayMs,
    });
  }

  static trackRetry(
    endpoint: string,
    attemptNumber: number,
    statusCode: number
  ) {
    analytics.track('api_retry', {
      endpoint,
      attempt: attemptNumber,
      status_code: statusCode,
    });
  }
}
```

---

## 7. Чеклист Реализации

- [ ] **Database Schema**: добавить etag, deleted_at, sync_changes таблица
- [ ] **API Endpoints**: DELETE с ETag проверкой, GET с syncToken
- [ ] **Webhook Service**: регистрация каналов, отправка уведомлений
- [ ] **Cascade Delete**: RPC функция для атомарного удаления
- [ ] **React Query**: integrация, optimistic mutations
- [ ] **WebhookSyncService**: инициализация, handling notifications
- [ ] **Error Handling**: retry logic, exponential backoff
- [ ] **Monitoring**: метрики для анализа синхронизации
- [ ] **Testing**: unit tests, integration tests, E2E tests
- [ ] **Documentation**: API contracts, deployment guide

---

## Заключение

Эта архитектура основана на **проверенных паттернах Google Calendar**:

✅ **Быстро**: Оптимистические обновления дают мгновенный feedback
✅ **Четко**: Webhook + sync tokens = надежная синхронизация между устройствами
✅ **Надежно**: ETag + retry logic предотвращают потерю данных
✅ **Масштабируемо**: Не требует persistent connections (WebSockets)
✅ **Просто**: RESTful API, стандартные HTTP методы

**Главное отличие от текущей архитектуры**: переход от **синхронных операций** к **асинхронным с оптимистическими обновлениями**, что дает **мгновенный UI feedback** и **надежную синхронизацию** между всеми клиентами.
