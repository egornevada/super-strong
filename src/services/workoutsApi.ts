/**
 * Workouts API service
 * Handles all communication with Supabase for workout data
 * Uses user_days instead of workouts for better structure
 */

import { logger } from '../lib/logger';
import { getUserSession } from './authApi';
import {
  getUserDayByDate,
  getUserDaysForMonth,
  getAllUserDays,
  createUserDay,
  deleteUserDay,
  getUserDayExercisesByDay,
  createUserDayExercise,
  deleteUserDayExercise,
  getUserDayExerciseSets,
  createUserDayExerciseSet,
  deleteUserDayExerciseSet,
  getExerciseByDirectusId,
  UserDay,
  UserDayExercise,
  UserDayExerciseSet,
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

// Export types for backward compatibility
export type SavedWorkout = UserDayType;
export type WorkoutExerciseData = UserDayExercise & { exercise?: Exercise };
export type WorkoutSetData = UserDayExerciseSet;

/**
 * Get all workouts for a specific user
 */
export async function getAllWorkoutsForUser(userId?: string): Promise<SavedWorkout[]> {
  try {
    // If userId not provided, try to get from session (for backward compatibility)
    let id = userId;
    if (!id) {
      const session = getUserSession();
      if (!session) {
        logger.warn('No user ID provided and no session found, returning empty user days');
        return [];
      }
      id = session.userId;
    }

    logger.debug('Fetching all user days for user', { userId: id });

    const userDays = await getAllUserDays(id);
    logger.info('All user days fetched successfully', { count: userDays.length });
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
    // If userId not provided, try to get from session (for backward compatibility)
    let id = userId;
    if (!id) {
      const session = getUserSession();
      if (!session) {
        logger.warn('No user ID provided and no session found, returning empty user days');
        return [];
      }
      id = session.userId;
    }

    logger.debug('Fetching user days for date', { date, userId: id });

    // Parse date to get year and month
    const dateParts = date.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);

    const userDays = await getUserDaysForMonth(id, year, month);
    logger.info('User days fetched successfully', { date, count: userDays.length });
    return userDays;
  } catch (error) {
    logger.error('Failed to fetch user days for date', { date, error });
    return [];
  }
}

/**
 * Save a user day with exercises and sets
 * Creates user_day → user_day_exercises → user_day_exercise_sets hierarchy
 */
export async function saveWorkout(date: string, exercises: ExerciseData[], userId?: string): Promise<string> {
  try {
    // If userId not provided, try to get from session
    let id = userId;
    if (!id) {
      const session = getUserSession();
      if (!session) {
        throw new Error('No user ID provided and no session found');
      }
      id = session.userId;
    }

    logger.debug('Saving user day workout', {
      date,
      userId: id,
      exerciseCount: exercises.length
    });

    // Check if user day exists for this date
    let userDay = await getUserDayByDate(id, date);

    if (!userDay) {
      // Create new user day
      userDay = await createUserDay(id, date);
      logger.debug('User day created', { userDayId: userDay.id, date });
    } else {
      logger.debug('Using existing user day', { userDayId: userDay.id, date });
    }

    // Create exercises and sets for each exercise
    let totalExercisesCreated = 0;
    let totalSetsCreated = 0;

    for (const exercise of exercises) {
      try {
        // Get exercise from Supabase by directus_id
        const supabaseExercise = await getExerciseByDirectusId(exercise.exerciseId);

        if (!supabaseExercise) {
          logger.warn('Exercise not found in Supabase', { directusId: exercise.exerciseId });
          continue;
        }

        // Create user_day_exercise record
        const userDayExercise = await createUserDayExercise(userDay.id, supabaseExercise.id);

        totalExercisesCreated++;
        logger.debug('User day exercise created', {
          userDayExerciseId: userDayExercise.id,
          exerciseId: supabaseExercise.id
        });

        // Create sets for this exercise
        for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
          const set = exercise.sets[setIndex];
          await createUserDayExerciseSet({
            user_day_exercise_id: userDayExercise.id,
            reps: set.reps,
            weight: set.weight,
            set_order: setIndex + 1
          });
          totalSetsCreated++;
        }
      } catch (error) {
        logger.warn('Failed to create exercise for user day', { exerciseId: exercise.exerciseId, error });
        // Continue with next exercise
      }
    }

    logger.info('User day workout saved successfully', {
      userDayId: userDay.id,
      date,
      exercisesCreated: totalExercisesCreated,
      setsCreated: totalSetsCreated
    });

    return userDay.id;
  } catch (error) {
    logger.error('Failed to save user day workout', { date, error });
    throw error;
  }
}

/**
 * Delete a user day and all its exercises and sets
 * Cascading delete removes exercises and sets automatically
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
 * Get user day exercises and sets for a specific day
 * Returns all exercises and their sets grouped by exercise ID
 */
export async function getWorkoutSetsForDay(date: string, userId?: string): Promise<{
  workoutId: string;
  exerciseSets: Map<string, WorkoutSetData[]>;
  exercises: Map<string, WorkoutExerciseData>;
} | null> {
  try {
    // If userId not provided, try to get from session
    let id = userId;
    if (!id) {
      const session = getUserSession();
      if (!session) {
        logger.warn('No user ID provided and no session found');
        return null;
      }
      id = session.userId;
    }

    logger.debug('Fetching user day exercises and sets for day', { date, userId: id });

    // Get user day for this date
    const userDay = await getUserDayByDate(id, date);

    if (!userDay) {
      logger.debug('No user day found for date', { date });
      return null;
    }

    // Get all exercises for this user day
    const userDayExercises = await getUserDayExercisesByDay(userDay.id);

    if (userDayExercises.length === 0) {
      logger.debug('No exercises found for user day', { userDayId: userDay.id });
      return {
        workoutId: userDay.id,
        exerciseSets: new Map(),
        exercises: new Map()
      };
    }

    // Create map of exercises by directus_id for quick lookup
    const exerciseMap = new Map<string, WorkoutExerciseData>();
    const exerciseSets = new Map<string, WorkoutSetData[]>();

    for (const userDayExercise of userDayExercises) {
      const exercise = userDayExercise.exercise;
      if (!exercise) continue;

      // Store exercise with directus_id as key for backward compatibility
      exerciseMap.set(exercise.directus_id, {
        ...userDayExercise,
        exercise
      });

      // Get sets for this exercise
      const sets = await getUserDayExerciseSets(userDayExercise.id);
      exerciseSets.set(exercise.directus_id, sets);
    }

    logger.info('User day exercises and sets loaded', {
      userDayId: userDay.id,
      exerciseCount: exerciseMap.size,
      totalSets: Array.from(exerciseSets.values()).reduce((sum, sets) => sum + sets.length, 0)
    });

    return {
      workoutId: userDay.id,
      exerciseSets,
      exercises: exerciseMap
    };
  } catch (error) {
    logger.error('Failed to get user day exercises and sets for day', { date, error });
    return null;
  }
}

/**
 * Convert app exercise format to API format
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

export default {
  getWorkoutsForDate,
  getAllWorkoutsForUser,
  saveWorkout,
  deleteWorkout,
  getWorkoutSetsForDay,
  convertExerciseToApiFormat
};
