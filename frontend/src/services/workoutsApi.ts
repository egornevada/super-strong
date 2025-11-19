/**
 * SIMPLIFIED Workouts API service
 * Linear, predictable flow with one path for everything
 * Supports both Supabase (legacy) and FastAPI backend (new)
 */

import { logger } from '../lib/logger';
import { getUserSession } from './authApi';
import { api } from '../lib/api';
import {
  getUserDayByDate,
  getUserDaysForMonth,
  getAllUserDays,
  createUserDay,
  deleteUserDay,
  getUserDayExercisesByWorkout,
  createWorkoutExercise,
  deleteUserDayExercise,
  getUserDayExerciseSets,
  createUserDayExerciseSet,
  deleteUserDayExerciseSet,
  getExerciseByDirectusId,
  getWorkoutSessionsForDay,
  createWorkoutSession,
  deleteWorkoutSession,
  UserDay,
  UserDayExerciseSet,
  UserDayWorkout,
  UserDayWorkoutExercise,
  Exercise,
  type UserDay as UserDayType
} from './supabaseApi';

interface WorkoutSet {
  reps: number;
  weight: number;
}

interface ExerciseData {
  exerciseId: string;
  sets: WorkoutSet[];
}

/**
 * Backend Workout Response Interface
 */
interface BackendWorkoutResponse {
  id: number;
  user_id: string | number;
  date: string;
  total_weight: number;
  total_sets: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Backend Exercise Response Interface
 */
interface BackendExerciseResponse {
  id: number;
  workout_id: number;
  exercise_id: string;
  weight: number;
  sets: number;
  reps: number;
  notes?: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

// Export types
export type SavedWorkout = UserDayType;
export type WorkoutSetData = UserDayExerciseSet;
export type WorkoutSessionWithExerciseCount = UserDayWorkout & { exerciseCount: number };

// ============================================================================
// BACKEND FUNCTIONS - FastAPI Backend Integration (New)
// ============================================================================

/**
 * Create a workout on the backend
 * POST /api/v1/workouts
 */
export async function createWorkoutOnBackend(
  date: string,
  totalWeight?: number,
  totalSets?: number,
  notes?: string
): Promise<BackendWorkoutResponse> {
  try {
    logger.debug('Creating workout on backend', { date });

    const response = await api.post<BackendWorkoutResponse>('/api/v1/workouts', {
      date,
      total_weight: totalWeight || 0,
      total_sets: totalSets || 0,
      notes: notes || ''
    });

    if (!response?.id) {
      throw new Error('Invalid response from backend');
    }

    logger.info('Workout created on backend', { workoutId: response.id, date });
    return response;
  } catch (error) {
    logger.error('Failed to create workout on backend', { date, error });
    throw error;
  }
}

/**
 * Get all workouts from backend
 * GET /api/v1/workouts
 */
export async function getAllWorkoutsFromBackend(limit: number = 100, offset: number = 0): Promise<BackendWorkoutResponse[]> {
  try {
    logger.debug('Fetching all workouts from backend', { limit, offset });

    const response = await api.get<BackendWorkoutResponse[]>(`/api/v1/workouts?limit=${limit}&offset=${offset}`);

    logger.info('Workouts fetched from backend', { count: response?.length || 0 });
    return response || [];
  } catch (error) {
    logger.error('Failed to fetch workouts from backend', { error });
    return [];
  }
}

/**
 * Delete workout from backend
 * DELETE /api/v1/workouts/{workout_id}
 */
export async function deleteWorkoutFromBackend(workoutId: number): Promise<boolean> {
  try {
    logger.debug('Deleting workout from backend', { workoutId });

    await api.delete(`/api/v1/workouts/${workoutId}`);

    logger.info('Workout deleted from backend', { workoutId });
    return true;
  } catch (error) {
    logger.error('Failed to delete workout from backend', { workoutId, error });
    return false;
  }
}

/**
 * Create exercise in workout on backend
 * POST /api/v1/workouts/{workout_id}/exercises
 */
export async function createExerciseOnBackend(
  workoutId: number,
  exerciseId: string,
  weight: number,
  sets: number,
  reps: number,
  order: number = 1,
  notes?: string
): Promise<BackendExerciseResponse> {
  try {
    logger.debug('Creating exercise on backend', { workoutId, exerciseId });

    const response = await api.post<BackendExerciseResponse>(
      `/api/v1/workouts/${workoutId}/exercises`,
      {
        exercise_id: exerciseId,
        weight,
        sets,
        reps,
        order,
        notes: notes || ''
      }
    );

    if (!response?.id) {
      throw new Error('Invalid response from backend');
    }

    logger.info('Exercise created on backend', { exerciseId, workoutId });
    return response;
  } catch (error) {
    logger.error('Failed to create exercise on backend', { workoutId, exerciseId, error });
    throw error;
  }
}

/**
 * Get monthly statistics from backend
 * GET /api/v1/workouts/statistics/monthly
 */
export async function getMonthlyStatisticsFromBackend(
  year: number,
  month: number
): Promise<any> {
  try {
    logger.debug('Fetching monthly statistics from backend', { year, month });

    const response = await api.get<any>(`/api/v1/workouts/statistics/monthly?year=${year}&month=${month}`);

    logger.info('Monthly statistics fetched from backend', { year, month });
    return response || {};
  } catch (error) {
    logger.error('Failed to fetch monthly statistics from backend', { year, month, error });
    return {};
  }
}

// ============================================================================
// CORE FUNCTIONS - Simple, Linear Logic (Supabase - Legacy)
// ============================================================================

/**
 * Get all workouts for a specific user (for monthly calendar)
 */
export async function getAllWorkoutsForUser(userId?: string): Promise<SavedWorkout[]> {
  try {
    let id = userId;
    if (!id) {
      const session = getUserSession();
      if (!session) {
        logger.warn('No user ID provided and no session found');
        return [];
      }
      id = session.userId;
    }

    const userDays = await getAllUserDays(id);
    return userDays;
  } catch (error) {
    logger.error('Failed to fetch all user days', { error });
    return [];
  }
}

/**
 * Get workouts for a specific month
 */
export async function getWorkoutsForDate(date: string, userId?: string): Promise<SavedWorkout[]> {
  try {
    let id = userId;
    if (!id) {
      const session = getUserSession();
      if (!session) {
        logger.warn('No user ID provided and no session found');
        return [];
      }
      id = session.userId;
    }

    const dateParts = date.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);

    const userDays = await getUserDaysForMonth(id, year, month);
    return userDays;
  } catch (error) {
    logger.error('Failed to fetch user days for date', { date, error });
    return [];
  }
}

/**
 * Get all workout sessions for a specific day with exercise counts
 * This is used to display sessions in DayDetailPage
 */
export async function getWorkoutSessionsWithCount(userDayId: string): Promise<WorkoutSessionWithExerciseCount[]> {
  try {
    logger.debug('Fetching workout sessions for day', { userDayId });

    const sessions = await getWorkoutSessionsForDay(userDayId);

    // Count exercises for each session
    const sessionsWithCount = await Promise.all(
      sessions.map(async (session) => {
        try {
          const exercises = await getUserDayExercisesByWorkout(session.id);
          return {
            ...session,
            exerciseCount: exercises.length
          };
        } catch (error) {
          logger.warn('Failed to count exercises for session', { sessionId: session.id, error });
          return {
            ...session,
            exerciseCount: 0
          };
        }
      })
    );

    logger.info('Workout sessions fetched', { userDayId, count: sessionsWithCount.length });
    return sessionsWithCount;
  } catch (error) {
    logger.error('Failed to fetch workout sessions', { userDayId, error });
    return [];
  }
}

/**
 * Create a workout session AND save all exercises with sets in one operation
 * NOW USES BACKEND API instead of direct Supabase calls
 * THIS IS THE MAIN SAVE FUNCTION - Used by MyExercisesPage
 */
export async function createAndSaveWorkoutSession(
  userId: string,
  userDayId: string,
  exercises: ExerciseData[],
  startedAt?: string | null
): Promise<string> {
  try {
    logger.debug('Creating workout session and saving exercises via backend', {
      userDayId,
      exerciseCount: exercises.length,
      startedAt
    });

    // Call the backend endpoint that handles the complete save operation
    const response = await api.post<{ session_id: string; exercises_count: number; sets_count: number }>(
      '/api/v1/supabase-workouts/session/save',
      {
        user_id: userId,
        user_day_id: userDayId,
        started_at: startedAt,
        exercises: exercises.map(ex => ({
          exercise_id: ex.exerciseId,
          sets: ex.sets
        }))
      }
    );

    if (!response?.session_id) {
      throw new Error('Invalid response from backend - no session_id');
    }

    logger.info('Workout session saved successfully via backend', {
      sessionId: response.session_id,
      exercisesSaved: response.exercises_count,
      setsSaved: response.sets_count
    });

    return response.session_id;
  } catch (error) {
    logger.error('Failed to create and save workout session', { userDayId, error });
    throw error;
  }
}

/**
 * Update an existing workout session with new exercises
 * NOW USES BACKEND API instead of direct Supabase calls
 * Deletes old exercises and saves new ones
 */
export async function updateWorkoutSessionExercises(
  workoutSessionId: string,
  exercises: ExerciseData[]
): Promise<void> {
  try {
    logger.debug('Updating workout session exercises via backend', {
      workoutSessionId,
      exerciseCount: exercises.length
    });

    // Call the backend endpoint that handles the complete update operation
    await api.put(
      `/api/v1/supabase-workouts/session/${workoutSessionId}/exercises`,
      {
        exercises: exercises.map(ex => ({
          exercise_id: ex.exerciseId,
          sets: ex.sets
        }))
      }
    );

    logger.info('Workout session updated successfully via backend', {
      workoutSessionId,
      exerciseCount: exercises.length
    });
  } catch (error) {
    logger.error('Failed to update workout session exercises', { workoutSessionId, error });
    throw error;
  }
}

/**
 * Get exercises and sets for a specific workout session
 * This is used when opening a saved workout to view/edit it
 */
export async function getWorkoutSessionExercises(workoutSessionId: string): Promise<{
  exercises: Array<UserDayWorkoutExercise & { exercise: Exercise }>;
  exercisesSets: Map<string, WorkoutSetData[]>;
} | null> {
  try {
    logger.debug('Fetching exercises for workout session', { workoutSessionId });

    // Get all exercises for this session
    const exercises = await getUserDayExercisesByWorkout(workoutSessionId);

    if (exercises.length === 0) {
      logger.debug('No exercises found for workout session', { workoutSessionId });
      return {
        exercises: [],
        exercisesSets: new Map()
      };
    }

    // Load all sets in PARALLEL instead of sequentially
    const setsPromises = exercises.map(exercise =>
      getUserDayExerciseSets(exercise.id)
        .then(sets => ({ exerciseId: exercise.id, sets }))
        .catch(error => {
          logger.warn('Failed to get sets for exercise', { exerciseId: exercise.id, error });
          return { exerciseId: exercise.id, sets: [] };
        })
    );

    const setsResults = await Promise.all(setsPromises);
    const exercisesSets = new Map<string, WorkoutSetData[]>();
    setsResults.forEach(({ exerciseId, sets }) => {
      exercisesSets.set(exerciseId, sets);
    });

    logger.info('Workout session exercises fetched', {
      workoutSessionId,
      exerciseCount: exercises.length
    });

    return {
      exercises,
      exercisesSets
    };
  } catch (error) {
    logger.error('Failed to fetch workout session exercises', { workoutSessionId, error });
    return null;
  }
}

/**
 * Delete a workout session and all its exercises and sets
 * NOW USES BACKEND API instead of direct Supabase calls
 */
export async function deleteWorkoutSessionWithExercises(workoutSessionId: string): Promise<void> {
  try {
    logger.debug('Deleting workout session via backend', { workoutSessionId });

    await api.delete(`/api/v1/supabase-workouts/session/${workoutSessionId}`);

    logger.info('Workout session deleted successfully via backend', { workoutSessionId });
  } catch (error) {
    logger.error('Failed to delete workout session', { workoutSessionId, error });
    throw error;
  }
}

// ============================================================================
// LEGACY FUNCTIONS (for backward compatibility with profile stats)
// ============================================================================

/**
 * Get user day exercises and sets for a specific day (all sessions combined)
 */
export async function getWorkoutSetsForDay(date: string, userId?: string): Promise<{
  workoutId: string;
  exerciseSets: Map<string, WorkoutSetData[]>;
  exercises: Map<string, any>;
} | null> {
  try {
    let id = userId;
    if (!id) {
      const session = getUserSession();
      if (!session) {
        logger.warn('No user ID provided and no session found');
        return null;
      }
      id = session.userId;
    }

    // Get user day for this date
    const userDay = await getUserDayByDate(id, date);

    if (!userDay) {
      logger.debug('No user day found for date', { date });
      return null;
    }

    // Get all workout sessions for this day
    const sessions = await getWorkoutSessionsForDay(userDay.id);

    if (sessions.length === 0) {
      return {
        workoutId: userDay.id,
        exerciseSets: new Map(),
        exercises: new Map()
      };
    }

    // Combine exercises from all sessions
    const exerciseMap = new Map();
    const exerciseSets = new Map<string, WorkoutSetData[]>();

    for (const session of sessions) {
      const exercises = await getUserDayExercisesByWorkout(session.id);

      for (const exercise of exercises) {
        if (!exercise.exercise) continue;

        const directusId = exercise.exercise.directus_id;
        // ВАЖНО: сохраняем информацию о упражнении (перезаписываем, т.к. информация одинаковая)
        exerciseMap.set(directusId, {
          ...exercise,
          exercise: exercise.exercise
        });

        const sets = await getUserDayExerciseSets(exercise.id);
        // ВАЖНО: объединяем сеты вместо перезаписи!
        // Если упражнение выполнялось в разных сессиях, нужно сложить все сеты
        const existingSets = exerciseSets.get(directusId) || [];
        exerciseSets.set(directusId, [...existingSets, ...sets]);
      }
    }

    logger.info('Workout sets for day loaded', {
      date,
      exerciseCount: exerciseMap.size
    });

    return {
      workoutId: userDay.id,
      exerciseSets,
      exercises: exerciseMap
    };
  } catch (error) {
    logger.error('Failed to get workout sets for day', { date, error });
    return null;
  }
}

/**
 * Delete a user day (legacy function)
 */
export async function deleteWorkout(userDayId: string): Promise<void> {
  try {
    logger.debug('Deleting user day', { userDayId });
    await deleteUserDay(userDayId);
    logger.info('User day deleted successfully', { userDayId });
  } catch (error) {
    logger.error('Failed to delete user day', { userDayId, error });
    throw error;
  }
}

/**
 * Convert exercise to API format
 */
export function convertExerciseToApiFormat(
  exerciseId: string,
  sets: Array<{ reps: number; weight: number }>
): ExerciseData {
  return {
    exerciseId,
    sets
  };
}

/**
 * Load ALL workout data for a user (all time)
 * This is used to calculate profile statistics correctly
 */
export async function loadAllUserWorkoutData(
  userId: string,
  allExercises: any[]
): Promise<Map<string, any[]>> {
  try {
    const result = new Map<string, any[]>();

    // Get all user days for all time
    const userDays = await getAllUserDays(userId);

    if (!userDays || userDays.length === 0) {
      return result;
    }

    // Load exercises and sets for each day in parallel
    const dayPromises = userDays.map(async (userDay) => {
      try {
        // Check if this day has any sessions - load both in parallel
        const [sessions, setsData] = await Promise.all([
          getWorkoutSessionsForDay(userDay.id),
          getWorkoutSetsForDay(userDay.date, userId)
        ]);

        if (!sessions || sessions.length === 0) {
          return null;
        }
        if (!setsData || setsData.exercises.size === 0) {
          return null;
        }

        // Convert to ExerciseWithTrackSets format
        const exercisesWithSets: any[] = [];
        for (const [directusExerciseId, workoutExercise] of setsData.exercises) {
          const exerciseSets = setsData.exerciseSets.get(directusExerciseId) || [];
          const trackSets = exerciseSets.map(set => ({
            reps: set.reps,
            weight: set.weight
          }));

          // Get exercise info
          let exerciseInfo = allExercises.find(ex => String(ex.id) === directusExerciseId);
          if (!exerciseInfo) {
            const exerciseName = (workoutExercise as any).exercise?.name || 'Unknown Exercise';
            exerciseInfo = {
              id: directusExerciseId,
              name: exerciseName,
              category: (workoutExercise as any).exercise?.category || 'Unknown',
              description: (workoutExercise as any).exercise?.description || ''
            };
          }

          exercisesWithSets.push({
            ...exerciseInfo,
            trackSets
          });
        }

        // Convert date format to dateKey format (day-month-year)
        const parts = userDay.date.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const dateMonth = parseInt(parts[1], 10) - 1;
          const dateYear = parseInt(parts[0], 10);
          const dateKey = `${day}-${dateMonth}-${dateYear}`;

          if (exercisesWithSets.length > 0) {
            return { dateKey, exercises: exercisesWithSets };
          }
        }

        return null;
      } catch (err) {
        logger.warn('Failed to load day workout data', { userDayId: userDay.id, error: err });
        return null;
      }
    });

    // Wait for all days to load in parallel
    const dayResults = await Promise.all(dayPromises);

    // Build the result map
    dayResults.forEach(dayResult => {
      if (dayResult) {
        result.set(dayResult.dateKey, dayResult.exercises);
      }
    });

    logger.info('All user workout data loaded', {
      daysCount: result.size
    });

    return result;
  } catch (error) {
    logger.error('Failed to load all user workout data', { error });
    return new Map();
  }
}

/**
 * Load all workout data for a month and return as Map<dateKey, exercises>
 * This is used to populate savedWorkouts for calendar statistics
 */
export async function loadMonthWorkoutData(
  year: number,
  month: number,
  userId: string,
  allExercises: any[]
): Promise<Map<string, any[]>> {
  try {
    const result = new Map<string, any[]>();

    // Get all user days for this month
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const userDays = await getUserDaysForMonth(userId, year, month + 1);

    if (!userDays || userDays.length === 0) {
      return result;
    }

    // Load exercises and sets for each day in parallel
    const dayPromises = userDays.map(async (userDay) => {
      try {
        // Check if this day has any sessions - load both in parallel
        const [sessions, setsData] = await Promise.all([
          getWorkoutSessionsForDay(userDay.id),
          getWorkoutSetsForDay(userDay.date, userId)
        ]);

        if (!sessions || sessions.length === 0) {
          return null;
        }
        if (!setsData || setsData.exercises.size === 0) {
          return null;
        }

        // Convert to ExerciseWithTrackSets format
        const exercisesWithSets: any[] = [];
        for (const [directusExerciseId, workoutExercise] of setsData.exercises) {
          const exerciseSets = setsData.exerciseSets.get(directusExerciseId) || [];
          const trackSets = exerciseSets.map(set => ({
            reps: set.reps,
            weight: set.weight
          }));

          // Get exercise info
          let exerciseInfo = allExercises.find(ex => String(ex.id) === directusExerciseId);
          if (!exerciseInfo) {
            const exerciseName = (workoutExercise as any).exercise?.name || 'Unknown Exercise';
            exerciseInfo = {
              id: directusExerciseId,
              name: exerciseName,
              category: (workoutExercise as any).exercise?.category || 'Unknown',
              description: (workoutExercise as any).exercise?.description || ''
            };
          }

          exercisesWithSets.push({
            ...exerciseInfo,
            trackSets
          });
        }

        // Convert date format to dateKey format (day-month-year)
        const parts = userDay.date.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const dateMonth = parseInt(parts[1], 10) - 1;
          const dateYear = parseInt(parts[0], 10);
          const dateKey = `${day}-${dateMonth}-${dateYear}`;

          if (exercisesWithSets.length > 0) {
            return { dateKey, exercises: exercisesWithSets };
          }
        }

        return null;
      } catch (err) {
        logger.warn('Failed to load day workout data', { userDayId: userDay.id, error: err });
        return null;
      }
    });

    // Wait for all days to load in parallel
    const dayResults = await Promise.all(dayPromises);

    // Build the result map
    dayResults.forEach(dayResult => {
      if (dayResult) {
        result.set(dayResult.dateKey, dayResult.exercises);
      }
    });

    logger.info('Month workout data loaded', {
      year,
      month,
      daysCount: result.size
    });

    return result;
  } catch (error) {
    logger.error('Failed to load month workout data', { year, month, error });
    return new Map();
  }
}

export default {
  getAllWorkoutsForUser,
  getWorkoutsForDate,
  getWorkoutSessionsWithCount,
  createAndSaveWorkoutSession,
  updateWorkoutSessionExercises,
  getWorkoutSessionExercises,
  deleteWorkoutSessionWithExercises,
  getWorkoutSetsForDay,
  deleteWorkout,
  convertExerciseToApiFormat,
  loadAllUserWorkoutData,
  loadMonthWorkoutData
};
