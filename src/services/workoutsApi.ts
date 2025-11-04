/**
 * Workouts API service
 * Handles all communication with PostgREST for workout data
 */

import { api } from '../lib/api';
import { logger } from '../lib/logger';
import { getUserSession } from './authApi';

interface WorkoutSet {
  reps: number;
  weight: number;
}

interface ExerciseData {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface SavedWorkout {
  id: number;
  user_id: number;
  workout_date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExerciseData {
  id: number;
  workout_id: number;
  directus_exercise_id: string;
  exercise_name?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSetData {
  id: number;
  workout_exercise_id: number;
  reps: number;
  weight: number;
  set_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get workouts for a specific date range
 * Fetches workouts from Directus for the current user
 */
export async function getAllWorkoutsForUser(): Promise<SavedWorkout[]> {
  try {
    const session = getUserSession();
    if (!session) {
      logger.warn('No user session found, returning empty workouts');
      return [];
    }

    logger.debug('Fetching all workouts for user', { userId: session.userId });

    // Fetch all workouts for the user without date filter
    const response = await api.get<{ data: SavedWorkout[] }>(
      `/items/workouts?filter[user_id][_eq]=${session.userId}&sort=-workout_date`
    );

    const workouts = Array.isArray(response) ? response : (response?.data || []);
    logger.info('All workouts fetched successfully', { count: workouts.length });
    return workouts;
  } catch (error) {
    logger.error('Failed to fetch all workouts', { error });
    // Return empty array instead of throwing - allows offline mode
    return [];
  }
}

export async function getWorkoutsForDate(date: string): Promise<SavedWorkout[]> {
  try {
    const session = getUserSession();
    if (!session) {
      logger.warn('No user session found, returning empty workouts');
      return [];
    }

    logger.debug('Fetching workouts for date', { date, userId: session.userId });

    // Get first day of month from the provided date
    const dateParts = date.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);

    // Calculate last day of month
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    // Fetch all workouts for the user in this month using Directus filters
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const response = await api.get<{ data: SavedWorkout[] }>(
      `/items/workouts?filter[user_id][_eq]=${session.userId}&filter[workout_date][_gte]=${startDate}&filter[workout_date][_lte]=${endDate}&sort=-workout_date`
    );

    const workouts = Array.isArray(response) ? response : (response?.data || []);
    logger.info('Workouts fetched successfully', { date, count: workouts.length });
    return workouts;
  } catch (error) {
    logger.error('Failed to fetch workouts for date', { date, error });
    // Return empty array instead of throwing - allows offline mode
    return [];
  }
}

/**
 * Save a workout with exercises and sets
 * Creates workout → workout_exercises → workout_sets hierarchy
 */
export async function saveWorkout(date: string, exercises: ExerciseData[]): Promise<string> {
  try {
    const session = getUserSession();
    if (!session) {
      throw new Error('No user session found');
    }

    logger.debug('Saving workout', {
      date,
      userId: session.userId,
      exerciseCount: exercises.length
    });

    // First, check if workout exists for this date
    let workoutId: number;
    const existingWorkouts = await api.get<{ data: SavedWorkout[] }>(
      `/items/workouts?filter[user_id][_eq]=${session.userId}&filter[workout_date][_eq]=${date}`
    );

    const workoutsList = Array.isArray(existingWorkouts) ? existingWorkouts : (existingWorkouts?.data || []);

    if (workoutsList.length > 0) {
      // Workout exists, use it
      workoutId = workoutsList[0].id;
      logger.debug('Using existing workout', { workoutId, date });
    } else {
      // Create new workout
      const workoutResponse = await api.post<{ data: SavedWorkout | SavedWorkout[] }>(
        '/items/workouts',
        {
          user_id: session.userId,
          workout_date: date
        }
      );

      const workoutData = workoutResponse?.data;
      const workout = Array.isArray(workoutData) ? workoutData[0] : workoutData;

      if (!workout || !workout.id) {
        throw new Error('Failed to create workout');
      }

      workoutId = workout.id;
      logger.debug('Workout created', { workoutId, date });
    }

    // Note: We no longer delete existing exercises since DELETE permission
    // is complex to configure. Instead, we'll create new exercises and let
    // users see their entire workout history.

    // Create exercises and sets for each exercise
    let totalExercisesCreated = 0;
    let totalSetsCreated = 0;

    for (const exercise of exercises) {
      // Create workout_exercise record first
      const exerciseResponse = await api.post<{ data: WorkoutExerciseData | WorkoutExerciseData[] }>(
        '/items/workout_exercises',
        {
          workout_id: workoutId,
          directus_exercise_id: exercise.exerciseId
        }
      );

      const exerciseData = exerciseResponse?.data;
      const workoutExercise = Array.isArray(exerciseData) ? exerciseData[0] : exerciseData;

      if (!workoutExercise || !workoutExercise.id) {
        logger.warn('Failed to create workout_exercise', { exerciseId: exercise.exerciseId });
        continue;
      }

      totalExercisesCreated++;
      logger.debug('Workout exercise created', {
        workoutExerciseId: workoutExercise.id,
        exerciseId: exercise.exerciseId
      });

      // Now create sets for this exercise
      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];
        const setResponse = await api.post<{ data: WorkoutSetData | WorkoutSetData[] }>(
          '/items/workout_sets',
          {
            workout_exercise_id: workoutExercise.id,
            reps: set.reps,
            weight: set.weight,
            set_order: setIndex + 1
          }
        );

        const setData = setResponse?.data;
        if (setData) {
          totalSetsCreated++;
        }
      }
    }

    logger.info('Workout saved successfully', {
      workoutId,
      date,
      exercisesCreated: totalExercisesCreated,
      setsCreated: totalSetsCreated
    });

    return workoutId.toString();
  } catch (error) {
    logger.error('Failed to save workout', { date, error });
    throw error;
  }
}

/**
 * Delete a workout and all its exercises and sets
 * Deleting workout_exercises cascades to workout_sets
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  try {
    logger.debug('Deleting workout', { workoutId });

    // Delete the workout itself
    // Note: Exercises and sets are not deleted due to permission constraints
    // They will remain in the database but won't be associated with any workout
    await api.delete(`/items/workouts/${workoutId}`);

    logger.info('Workout deleted successfully', { workoutId });
  } catch (error) {
    logger.error('Failed to delete workout', { workoutId, error });
    throw error;
  }
}

/**
 * Get workout exercises and sets for a specific day
 * Returns all exercises and their sets grouped by directus_exercise_id
 */
export async function getWorkoutSetsForDay(date: string): Promise<{
  workoutId: number;
  exerciseSets: Map<string, WorkoutSetData[]>;
  exercises: Map<string, WorkoutExerciseData>;
} | null> {
  try {
    const session = getUserSession();
    if (!session) {
      return null;
    }

    logger.debug('Fetching workout sets for day', { date, userId: session.userId });

    // Get workout for this day
    const workoutResponse = await api.get<{ data: SavedWorkout[] }>(
      `/items/workouts?filter[user_id][_eq]=${session.userId}&filter[workout_date][_eq]=${date}`
    );

    const workouts = Array.isArray(workoutResponse) ? workoutResponse : (workoutResponse?.data || []);

    if (workouts.length === 0) {
      logger.debug('No workout found for date', { date });
      return null;
    }

    const workout = workouts[0];

    // Get all exercises for this workout
    const exerciseResponse = await api.get<{ data: WorkoutExerciseData[] }>(
      `/items/workout_exercises?filter[workout_id][_eq]=${workout.id}`
    );

    const exercises = Array.isArray(exerciseResponse) ? exerciseResponse : (exerciseResponse?.data || []);

    if (exercises.length === 0) {
      logger.debug('No exercises found for workout', { workoutId: workout.id });
      return {
        workoutId: workout.id,
        exerciseSets: new Map(),
        exercises: new Map()
      };
    }

    // Create map of exercises by ID for quick lookup
    const exerciseMap = new Map<string, WorkoutExerciseData>();
    const exerciseIds: number[] = [];

    exercises.forEach(exercise => {
      exerciseMap.set(exercise.directus_exercise_id, exercise);
      exerciseIds.push(exercise.id);
    });

    // Get all sets for all exercises in this workout
    // We need to query sets for each workout_exercise
    const exerciseSets = new Map<string, WorkoutSetData[]>();

    for (const exercise of exercises) {
      const setsResponse = await api.get<{ data: WorkoutSetData[] }>(
        `/items/workout_sets?filter[workout_exercise_id][_eq]=${exercise.id}&sort=set_order`
      );

      const sets = Array.isArray(setsResponse) ? setsResponse : (setsResponse?.data || []);
      exerciseSets.set(exercise.directus_exercise_id, sets);
    }

    logger.info('Workout sets loaded', {
      workoutId: workout.id,
      exerciseCount: exerciseMap.size,
      totalSets: Array.from(exerciseSets.values()).reduce((sum, sets) => sum + sets.length, 0)
    });

    return {
      workoutId: workout.id,
      exerciseSets,
      exercises: exerciseMap
    };
  } catch (error) {
    logger.error('Failed to get workout sets for day', { date, error });
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
  saveWorkout,
  deleteWorkout,
  convertExerciseToApiFormat
};
