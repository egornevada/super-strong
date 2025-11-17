/**
 * Custom hook for loading workouts for a specific month
 * 📖 Uses TanStack Query for efficient caching and prefetching
 * Source: https://tanstack.com/query/latest/docs/framework/react/guides/queries
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkoutsForDate } from '../services/workoutsApi';

interface UseMonthWorkoutsOptions {
  year: number;
  month: number;
  userId?: string;
}

/**
 * Load workouts for a specific month
 * Automatically caches data for 5 minutes (staleTime)
 * Data persists in memory for 10 minutes (gcTime) even if not used
 *
 * Usage:
 * const { data, isLoading, error } = useMonthWorkouts({ year: 2025, month: 10 })
 */
export function useMonthWorkouts({ year, month, userId }: UseMonthWorkoutsOptions) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  return useQuery({
    queryKey: ['workouts-month', year, month],
    queryFn: async () => {
      const workouts = await getWorkoutsForDate(dateStr, userId);
      return workouts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - fresh data
    gcTime: 1000 * 60 * 10,   // 10 minutes - keep in memory
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Helper hook to prefetch workouts for adjacent months
 * Useful for navigation buttons and performance optimization
 *
 * Usage:
 * const prefetchNext = usePrefetchAdjacentMonths()
 * onMouseEnter={() => prefetchNext(year, month + 1)}
 */
export function usePrefetchAdjacentMonths() {
  const queryClient = useQueryClient();

  return (year: number, month: number) => {
    queryClient.prefetchQuery({
      queryKey: ['workouts-month', year, month],
      queryFn: async () => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        return getWorkoutsForDate(dateStr);
      },
      staleTime: 1000 * 60 * 5,
    });
  };
}

/**
 * Helper to invalidate workouts for a specific month
 * Used after creating, updating, or deleting workouts
 *
 * Usage:
 * const invalidateMonth = useInvalidateMonth()
 * invalidateMonth(2025, 10)
 */
export function useInvalidateMonth() {
  const queryClient = useQueryClient();

  return (year: number, month: number) => {
    queryClient.invalidateQueries({
      queryKey: ['workouts-month', year, month],
    });
  };
}
