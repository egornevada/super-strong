/**
 * Hook для оптимистического удаления тренировки
 *
 * ИСТОЧНИК ПАТТЕРНА: REFERENCES.md, Подход 1: UI-Based (РЕКОМЕНДУЕТСЯ)
 * Официальные источники:
 * - https://react.dev/reference/react/useOptimistic
 * - https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
 * - https://tanstack.com/query/latest/docs/framework/react/guides/mutations
 *
 * ЛОГИКА (простая и надежная):
 * 1. User нажимает "Удалить"
 * 2. UI обновляется СРАЗУ (оптимистично) - элемент исчезает (0мс)
 * 3. API запрос отправляется в ФОНЕ
 * 4. На успех - кэш инвалидируется, данные перезагружаются
 * 5. На ошибку - UI откатывается автоматически, пользователь видит ошибку
 *
 * ПЛЮСЫ подхода:
 * ✅ Простой код
 * ✅ Нет race conditions
 * ✅ Автоматический rollback на ошибку
 * ✅ Пользователь сразу видит результат
 */

import { useOptimistic, useCallback, useTransition } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteWorkoutSessionWithExercises } from '../services/workoutsApi';
import { logger } from '../lib/logger';
import { showTelegramAlert } from '../lib/telegram';

interface UseOptimisticDeleteWorkoutProps {
  sessions: any[];
  onSuccess?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

interface UseOptimisticDeleteWorkoutReturn {
  optimisticSessions: any[];
  deleteWorkout: (workoutId: string) => Promise<void>;
  isDeleting: boolean;
  deletingSessionId: string | null;
  error: Error | null;
}

/**
 * Hook для оптимистического удаления тренировки
 *
 * Использует UI-Based подход (самый простой и рекомендуемый):
 * - useOptimistic: обновляет UI СРАЗУ
 * - useMutation: отправляет запрос в ФОНЕ
 * - invalidateQueries: перезагружает данные на успех
 *
 * @param sessions - текущий список тренировок
 * @param onSuccess - callback при успешном удалении (вызывается ПОСЛЕ инвалидации кэша)
 * @param onError - callback при ошибке удаления
 * @returns { optimisticSessions, deleteWorkout, isDeleting, deletingSessionId, error }
 */
export function useOptimisticDeleteWorkout({
  sessions,
  onSuccess,
  onError
}: UseOptimisticDeleteWorkoutProps): UseOptimisticDeleteWorkoutReturn {
  const queryClient = useQueryClient();
  const [_isPending, startTransition] = useTransition();

  // Шаг 1: useOptimistic для мгновенного UI update
  // Источник: https://react.dev/reference/react/useOptimistic (React 19+)
  const [optimisticSessions, removeOptimisticSession] = useOptimistic(
    sessions,
    (currentSessions: any[], workoutIdToRemove: string) => {
      logger.debug('[UI] Оптимистический update: удаляем сессию из UI', { workoutIdToRemove });
      return currentSessions.filter((session) => session.id !== workoutIdToRemove);
    }
  );

  // Шаг 2: useMutation для асинхронной операции с сервером
  // Источник: https://tanstack.com/query/latest/docs/framework/react/guides/mutations (v5)
  const mutation = useMutation({
    // mutationFn: функция которая отправляет запрос на сервер
    mutationFn: async (workoutSessionId: string) => {
      logger.info('[API] Начинаем удаление тренировки с сервера', { workoutSessionId });
      await deleteWorkoutSessionWithExercises(workoutSessionId);
      logger.info('[API] Тренировка успешно удалена с сервера', { workoutSessionId });
      return { success: true };
    },

    // onSuccess: вызывается ПОСЛЕ успешного API запроса
    onSuccess: async () => {
      logger.info('[CACHE] Инвалидируем кэши для перезагрузки данных');

      // Инвалидируем кэши - React Query автоматически перезагружает данные
      // Источник: https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults#caching-examples
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workouts'] }),
        queryClient.invalidateQueries({ queryKey: ['workoutDays'] }),
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
      ]);

      logger.info('[CACHE] Кэш инвалидирован, данные будут перезагружены');

      // Вызываем пользовательский callback (например, для навигации)
      if (onSuccess) {
        try {
          await onSuccess();
        } catch (error) {
          logger.warn('[CALLBACK] Ошибка в onSuccess callback', { error });
        }
      }
    },

    // onError: вызывается если API запрос не удался
    onError: (error: Error) => {
      logger.error('[ERROR] Ошибка удаления тренировки с сервера', { error });

      // Показываем уведомление пользователю
      showTelegramAlert('Ошибка удаления тренировки. Попробуйте снова.');

      // Вызываем пользовательский callback для ошибки
      if (onError) {
        try {
          onError(error);
        } catch (callbackError) {
          logger.warn('[CALLBACK] Ошибка в onError callback', { callbackError });
        }
      }
    }
  });

  // Шаг 3: Главная функция удаления (вызывается из компонента)
  const deleteWorkout = useCallback(
    async (workoutSessionId: string) => {
      try {
        logger.debug('[DELETE] Пользователь подтвердил удаление', { workoutSessionId });

        // 1️⃣ Оптимистический update UI (0мс) - БЕЗ ожидания API
        // Обернуть в startTransition для React 19 compatibility
        // Источник: https://react.dev/reference/react/useOptimistic
        startTransition(() => {
          removeOptimisticSession(workoutSessionId);
        });
        logger.debug('[UI] Оптимистический update применен - элемент исчез', { workoutSessionId });

        // 2️⃣ API запрос в ФОНЕ (не блокирует UI)
        logger.debug('[API] Отправляем запрос на удаление на сервер', { workoutSessionId });
        await mutation.mutateAsync(workoutSessionId);

        logger.info('[SUCCESS] Удаление завершено успешно', { workoutSessionId });
      } catch (error) {
        logger.error('[ERROR] Ошибка в процессе удаления', { workoutSessionId, error });
        // ВАЖНО: UI автоматически откатывается через useOptimistic механизм
        // Элемент вернется на место если произошла ошибка
      }
    },
    [mutation, removeOptimisticSession, startTransition]
  );

  return {
    optimisticSessions,
    deleteWorkout,
    isDeleting: mutation.isPending,
    deletingSessionId: mutation.variables || null,
    error: mutation.error
  };
}
