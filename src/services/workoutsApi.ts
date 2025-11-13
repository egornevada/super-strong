/**
 * SIMPLIFIED Workouts API service
 * Linear, predictable flow with one path for everything
 */

import { logger } from '../lib/logger';
import { getUserSession } from './authApi';
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

// Export types
export type SavedWorkout = UserDayType;
export type WorkoutSetData = UserDayExerciseSet;
export type WorkoutSessionWithExerciseCount = UserDayWorkout & { exerciseCount: number };

// ============================================================================
// CORE FUNCTIONS - Simple, Linear Logic
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
 * OPTIMIZED: Uses Promise.all for parallel saving of exercises and sets
 * THIS IS THE MAIN SAVE FUNCTION - Used by MyExercisesPage
 */
export async function createAndSaveWorkoutSession(
  userId: string,
  userDayId: string,
  exercises: ExerciseData[]
): Promise<string> {
  try {
    logger.debug('Creating workout session and saving exercises', {
      userDayId,
      exerciseCount: exercises.length
    });

    // Step 1: Create the workout session
    const startedAt = new Date().toISOString();
    const session = await createWorkoutSession(userId, userDayId, startedAt);
    logger.debug('Workout session created', { sessionId: session.id, startedAt });

    // Step 2: Load all Supabase exercises in PARALLEL (not sequentially)
    const supabaseExercisePromises = exercises.map(exercise =>
      getExerciseByDirectusId(exercise.exerciseId)
        .catch(error => {
          logger.warn('Failed to get exercise from Supabase', { directusId: exercise.exerciseId, error });
          return null;
        })
    );
    const supabaseExercises = await Promise.all(supabaseExercisePromises);

    // Step 3: Create all workout exercises in PARALLEL
    const workoutExercisePromises: Promise<any>[] = [];
    const validExercisePairs: Array<{ exercise: ExerciseData; workoutExercisePromise: Promise<any> }> = [];

    supabaseExercises.forEach((supabaseExercise, index) => {
      if (!supabaseExercise) {
        logger.warn('Exercise not found in Supabase', { directusId: exercises[index].exerciseId });
        return;
      }

      const promise = createWorkoutExercise(session.id, supabaseExercise.id);
      workoutExercisePromises.push(promise);
      validExercisePairs.push({
        exercise: exercises[index],
        workoutExercisePromise: promise
      });
    });

    const workoutExercises = await Promise.all(workoutExercisePromises);
    logger.debug('All workout exercises created', { count: workoutExercises.length });

    // Step 4: Create all sets for all exercises in PARALLEL
    const allSetPromises: Promise<any>[] = [];

    for (let i = 0; i < validExercisePairs.length; i++) {
      const { exercise, workoutExercisePromise } = validExercisePairs[i];
      const workoutExercise = workoutExercises[i];

      // Create set promises for this exercise
      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];
        const setPromise = createUserDayExerciseSet({
          user_day_workout_exercise_id: workoutExercise.id,
          reps: set.reps,
          weight: set.weight,
          set_order: setIndex + 1
        });
        allSetPromises.push(setPromise);
      }
    }

    // Wait for all sets to be created in parallel
    const savedSets = await Promise.all(allSetPromises);
    const setsSaved = savedSets.length;

    logger.info('Workout session saved successfully', {
      sessionId: session.id,
      exercisesSaved: workoutExercises.length,
      setsSaved
    });

    return session.id;
  } catch (error) {
    logger.error('Failed to create and save workout session', { userDayId, error });
    throw error;
  }
}

/**
 * Update an existing workout session with new exercises
 * Deletes old exercises and saves new ones
 * OPTIMIZED: Uses Promise.all for parallel saving of exercises and sets
 */
export async function updateWorkoutSessionExercises(
  workoutSessionId: string,
  exercises: ExerciseData[]
): Promise<void> {
  try {
    logger.debug('Updating workout session exercises', {
      workoutSessionId,
      exerciseCount: exercises.length
    });

    // Step 1: Delete all existing exercises for this session in PARALLEL
    const existingExercises = await getUserDayExercisesByWorkout(workoutSessionId);
    const deletePromises = existingExercises.map(ex => deleteUserDayExercise(ex.id));
    await Promise.all(deletePromises);
    logger.debug('Deleted existing exercises', { count: existingExercises.length });

    // Step 2: Load all Supabase exercises in PARALLEL
    const supabaseExercisePromises = exercises.map(exercise =>
      getExerciseByDirectusId(exercise.exerciseId)
        .catch(error => {
          logger.warn('Failed to get exercise from Supabase', { directusId: exercise.exerciseId, error });
          return null;
        })
    );
    const supabaseExercises = await Promise.all(supabaseExercisePromises);

    // Step 3: Create all workout exercises in PARALLEL
    const workoutExercisePromises: Promise<any>[] = [];
    const validExercisePairs: Array<{ exercise: ExerciseData; index: number }> = [];

    supabaseExercises.forEach((supabaseExercise, index) => {
      if (!supabaseExercise) {
        logger.warn('Exercise not found in Supabase', { directusId: exercises[index].exerciseId });
        return;
      }

      const promise = createWorkoutExercise(workoutSessionId, supabaseExercise.id);
      workoutExercisePromises.push(promise);
      validExercisePairs.push({
        exercise: exercises[index],
        index
      });
    });

    const workoutExercises = await Promise.all(workoutExercisePromises);
    logger.debug('All workout exercises created', { count: workoutExercises.length });

    // Step 4: Create all sets for all exercises in PARALLEL
    const allSetPromises: Promise<any>[] = [];

    for (let i = 0; i < validExercisePairs.length; i++) {
      const { exercise } = validExercisePairs[i];
      const workoutExercise = workoutExercises[i];

      // Create set promises for this exercise
      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];
        const setPromise = createUserDayExerciseSet({
          user_day_workout_exercise_id: workoutExercise.id,
          reps: set.reps,
          weight: set.weight,
          set_order: setIndex + 1
        });
        allSetPromises.push(setPromise);
      }
    }

    // Wait for all sets to be created in parallel
    const savedSets = await Promise.all(allSetPromises);
    const setsSaved = savedSets.length;

    logger.info('Workout session updated successfully', {
      workoutSessionId,
      exercisesSaved: workoutExercises.length,
      setsSaved
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

    // Get sets for each exercise
    const exercisesSets = new Map<string, WorkoutSetData[]>();
    for (const exercise of exercises) {
      const sets = await getUserDayExerciseSets(exercise.id);
      exercisesSets.set(exercise.id, sets);
    }

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
 */
export async function deleteWorkoutSessionWithExercises(workoutSessionId: string): Promise<void> {
  try {
    logger.debug('Deleting workout session', { workoutSessionId });

    await deleteWorkoutSession(workoutSessionId);

    logger.info('Workout session deleted successfully', { workoutSessionId });
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
        // Check if this day has any sessions
        const sessions = await getWorkoutSessionsForDay(userDay.id);
        if (!sessions || sessions.length === 0) {
          return null;
        }

        // Get all exercises from all sessions for this day
        const setsData = await getWorkoutSetsForDay(userDay.date, userId);
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
        // Check if this day has any sessions
        const sessions = await getWorkoutSessionsForDay(userDay.id);
        if (!sessions || sessions.length === 0) {
          return null;
        }

        // Get all exercises from all sessions for this day
        const setsData = await getWorkoutSetsForDay(userDay.date, userId);
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
