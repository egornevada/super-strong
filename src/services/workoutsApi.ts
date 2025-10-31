/**
 * Workouts API service
 * Handles all communication with the workout server
 */

import { api } from '../lib/api';
import { logger } from '../lib/logger';

interface UserInfo {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
}

interface WorkoutSet {
  reps: number;
  weight: number;
}

interface ExerciseData {
  exerciseId: string;
  sets: WorkoutSet[];
}

interface WorkoutData {
  date: string;
  exercises: ExerciseData[];
}

interface SavedWorkout {
  id: string;
  userId: string;
  workoutDate: string;
  exercises: Array<{
    exerciseId: string;
    sets: WorkoutSet[];
  }>;
  createdAt: string;
}

interface WorkoutsResponse {
  workouts: SavedWorkout[];
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<UserInfo> {
  try {
    logger.debug('Fetching current user...');
    const user = await api.get<UserInfo>('/me');
    logger.info('User fetched successfully', { username: user.username });
    return user;
  } catch (error) {
    logger.error('Failed to fetch current user', error);
    throw error;
  }
}

/**
 * Get workouts for a specific date
 */
export async function getWorkoutsForDate(date: string): Promise<SavedWorkout[]> {
  try {
    logger.debug('Fetching workouts for date', { date });
    const response = await api.get<WorkoutsResponse>(`/workouts?date=${date}`);
    logger.info('Workouts fetched successfully', { date, count: response.workouts.length });
    return response.workouts;
  } catch (error) {
    logger.error('Failed to fetch workouts for date', { date, error });
    throw error;
  }
}

/**
 * Save a workout
 */
export async function saveWorkout(date: string, exercises: ExerciseData[]): Promise<string> {
  try {
    logger.debug('Saving workout', { date, exerciseCount: exercises.length, exercises });

    const data: WorkoutData = {
      date,
      exercises
    };

    logger.info('Sending workout to API...', { endpoint: '/workouts', payload: data });

    const response = await api.post<{ success: boolean; workoutId: string }>('/workouts', data);

    logger.info('API response received', { response });

    if (response.success) {
      logger.info('Workout saved successfully', { date, workoutId: response.workoutId });
      return response.workoutId;
    }

    throw new Error('Server returned success: false');
  } catch (error) {
    logger.error('Failed to save workout', { date, exercises: exercises.length, error });
    throw error;
  }
}

/**
 * Delete a workout
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  try {
    logger.debug('Deleting workout', { workoutId });

    const response = await api.delete<{ success: boolean }>(`/workouts/${workoutId}`);

    if (response.success) {
      logger.info('Workout deleted successfully', { workoutId });
      return;
    }

    throw new Error('Server returned success: false');
  } catch (error) {
    logger.error('Failed to delete workout', { workoutId, error });
    throw error;
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
  getCurrentUser,
  getWorkoutsForDate,
  saveWorkout,
  deleteWorkout,
  convertExerciseToApiFormat
};
