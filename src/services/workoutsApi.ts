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

    // Step 2: Save each exercise with its sets
    let exercisesSaved = 0;
    let setsSaved = 0;

    for (const exercise of exercises) {
      try {
        // Get the Supabase exercise
        const supabaseExercise = await getExerciseByDirectusId(exercise.exerciseId);

        if (!supabaseExercise) {
          logger.warn('Exercise not found in Supabase', { directusId: exercise.exerciseId });
          continue;
        }

        // Create workout exercise
        const workoutExercise = await createWorkoutExercise(session.id, supabaseExercise.id);
        exercisesSaved++;
        logger.debug('Workout exercise created', {
          sessionId: session.id,
          exerciseName: supabaseExercise.name
        });

        // Create sets for this exercise
        for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
          const set = exercise.sets[setIndex];
          await createUserDayExerciseSet({
            user_day_workout_exercise_id: workoutExercise.id,
            reps: set.reps,
            weight: set.weight,
            set_order: setIndex + 1
          });
          setsSaved++;
        }
      } catch (error) {
        logger.warn('Failed to save exercise', { exerciseId: exercise.exerciseId, error });
        // Continue with next exercise
      }
    }

    logger.info('Workout session saved successfully', {
      sessionId: session.id,
      exercisesSaved,
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

    // Step 1: Delete all existing exercises for this session
    const existingExercises = await getUserDayExercisesByWorkout(workoutSessionId);
    for (const existingExercise of existingExercises) {
      await deleteUserDayExercise(existingExercise.id);
    }
    logger.debug('Deleted existing exercises', { count: existingExercises.length });

    // Step 2: Add new exercises with their sets
    let exercisesSaved = 0;
    let setsSaved = 0;

    for (const exercise of exercises) {
      try {
        // Get the Supabase exercise
        const supabaseExercise = await getExerciseByDirectusId(exercise.exerciseId);

        if (!supabaseExercise) {
          logger.warn('Exercise not found in Supabase', { directusId: exercise.exerciseId });
          continue;
        }

        // Create workout exercise
        const workoutExercise = await createWorkoutExercise(workoutSessionId, supabaseExercise.id);
        exercisesSaved++;
        logger.debug('Workout exercise created', {
          sessionId: workoutSessionId,
          exerciseName: supabaseExercise.name
        });

        // Create sets for this exercise
        for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
          const set = exercise.sets[setIndex];
          await createUserDayExerciseSet({
            user_day_workout_exercise_id: workoutExercise.id,
            reps: set.reps,
            weight: set.weight,
            set_order: setIndex + 1
          });
          setsSaved++;
        }
      } catch (error) {
        logger.warn('Failed to save exercise', { exerciseId: exercise.exerciseId, error });
        // Continue with next exercise
      }
    }

    logger.info('Workout session updated successfully', {
      workoutSessionId,
      exercisesSaved,
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
        exerciseMap.set(directusId, {
          ...exercise,
          exercise: exercise.exercise
        });

        const sets = await getUserDayExerciseSets(exercise.id);
        exerciseSets.set(directusId, sets);
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
  convertExerciseToApiFormat
};
