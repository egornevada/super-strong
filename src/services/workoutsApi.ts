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

export interface WorkoutSetData {
  id: number;
  workout_id: number;
  exercise_id: string;
  reps: number;
  weight: number;
  set_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get workouts for a specific date range
 * Fetches workouts from PostgREST for the current user
 */
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

    // Fetch all workouts for the user in this month using PostgREST range filter
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const response = await api.get<SavedWorkout[]>(
      `/workouts?user_id=eq.${session.userId}&workout_date=gte.${startDate}&workout_date=lte.${endDate}&order=workout_date.desc`
    );

    const workouts = Array.isArray(response) ? response : [];
    logger.info('Workouts fetched successfully', { date, count: workouts.length });
    return workouts;
  } catch (error) {
    logger.error('Failed to fetch workouts for date', { date, error });
    // Return empty array instead of throwing - allows offline mode
    return [];
  }
}

/**
 * Save a workout with sets
 * Creates a new workout record and associated sets
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
    const existingWorkouts = await api.get<SavedWorkout[]>(
      `/workouts?user_id=eq.${session.userId}&workout_date=eq.${date}`
    );

    if (Array.isArray(existingWorkouts) && existingWorkouts.length > 0) {
      // Workout exists, use it
      workoutId = existingWorkouts[0].id;
      logger.debug('Using existing workout', { workoutId, date });
    } else {
      // Create new workout
      const workoutResponse = await api.post<SavedWorkout | SavedWorkout[]>('/workouts', {
        user_id: session.userId,
        workout_date: date
      });

      const workout = Array.isArray(workoutResponse) ? workoutResponse[0] : workoutResponse;

      if (!workout || !workout.id) {
        throw new Error('Failed to create workout');
      }

      workoutId = workout.id;
      logger.debug('Workout created', { workoutId, date });
    }

    // Delete existing sets for this workout to avoid duplicates
    await api.delete(`/workout_sets?workout_id=eq.${workoutId}`).catch(() => {
      // Ignore if no sets exist
      logger.debug('No existing sets to delete');
    });

    // Create sets for each exercise
    let totalSetsCreated = 0;
    for (const exercise of exercises) {
      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];
        const setResponse = await api.post<WorkoutSetData | WorkoutSetData[]>('/workout_sets', {
          workout_id: workoutId,
          exercise_id: exercise.exerciseId,
          reps: set.reps,
          weight: set.weight,
          set_order: setIndex + 1
        });

        if (setResponse && (Array.isArray(setResponse) ? setResponse.length > 0 : setResponse.id)) {
          totalSetsCreated++;
        }
      }
    }

    logger.info('Workout saved successfully', {
      workoutId,
      date,
      setsCreated: totalSetsCreated
    });

    return workoutId.toString();
  } catch (error) {
    logger.error('Failed to save workout', { date, error });
    throw error;
  }
}

/**
 * Delete a workout and all its sets
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  try {
    logger.debug('Deleting workout', { workoutId });

    // Delete all sets for this workout first (due to foreign key constraint)
    await api.delete(`/workout_sets?workout_id=eq.${workoutId}`);

    // Then delete the workout
    await api.delete(`/workouts?id=eq.${workoutId}`);

    logger.info('Workout deleted successfully', { workoutId });
  } catch (error) {
    logger.error('Failed to delete workout', { workoutId, error });
    throw error;
  }
}

/**
 * Get workout sets for a specific day
 * Returns all sets grouped by exercise for that day
 */
export async function getWorkoutSetsForDay(date: string): Promise<{
  workoutId: number;
  exerciseSets: Map<string, WorkoutSetData[]>;
} | null> {
  try {
    const session = getUserSession();
    if (!session) {
      return null;
    }

    logger.debug('Fetching workout sets for day', { date, userId: session.userId });

    // Get workout for this day
    const workouts = await api.get<SavedWorkout[]>(
      `/workouts?user_id=eq.${session.userId}&workout_date=eq.${date}`
    );

    if (!Array.isArray(workouts) || workouts.length === 0) {
      logger.debug('No workout found for date', { date });
      return null;
    }

    const workout = workouts[0];

    // Get all sets for this workout, ordered by exercise and set_order
    const sets = await api.get<WorkoutSetData[]>(
      `/workout_sets?workout_id=eq.${workout.id}&order=exercise_id.asc,set_order.asc`
    );

    if (!Array.isArray(sets)) {
      logger.debug('No sets found for workout', { workoutId: workout.id });
      return {
        workoutId: workout.id,
        exerciseSets: new Map()
      };
    }

    // Group sets by exercise_id
    const exerciseSets = new Map<string, WorkoutSetData[]>();
    sets.forEach(set => {
      const existing = exerciseSets.get(set.exercise_id) || [];
      existing.push(set);
      exerciseSets.set(set.exercise_id, existing);
    });

    logger.info('Workout sets loaded', {
      workoutId: workout.id,
      exerciseCount: exerciseSets.size,
      totalSets: sets.length
    });

    return {
      workoutId: workout.id,
      exerciseSets
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
