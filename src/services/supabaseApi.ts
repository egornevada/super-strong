import { createClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  telegram_id?: number;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  directus_id: string;
  name: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserDay {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface UserDayExercise {
  id: string;
  user_day_id: string;
  exercise_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserDayWorkout {
  id: string;
  user_id: string;
  user_day_id: string;
  started_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserDayExerciseSet {
  id: string;
  user_day_workout_exercise_id: string;
  reps: number;
  weight: number;
  set_order: number;
  created_at: string;
  updated_at: string;
}

// Updated exercise interface to work with workouts
export interface UserDayWorkoutExercise {
  id: string;
  user_day_workout_id: string;
  exercise_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Users
// ============================================================================

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    logger.error('Error fetching user by username', { username, error });
    throw error;
  }
}

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    logger.error('Error fetching user by telegram ID', { telegramId, error });
    throw error;
  }
}

export async function createUser(payload: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create user');
    }

    logger.info('User created successfully', { userId: data.id, username: payload.username });
    return data;
  } catch (error) {
    logger.error('Error creating user', { payload, error });
    throw error;
  }
}

export async function updateUser(userId: string, payload: Partial<User>): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to update user');
    }

    logger.info('User updated successfully', { userId });
    return data;
  } catch (error) {
    logger.error('Error updating user', { userId, payload, error });
    throw error;
  }
}

export async function getOrCreateUserByUsername(
  username: string,
  telegramId?: number,
  firstName?: string,
  lastName?: string
): Promise<User> {
  try {
    const existingUser = await getUserByUsername(username);

    if (existingUser) {
      if (telegramId && !existingUser.telegram_id) {
        return updateUser(existingUser.id, { telegram_id: telegramId });
      }
      return existingUser;
    }

    return createUser({
      username,
      telegram_id: telegramId,
      first_name: firstName,
      last_name: lastName
    });
  } catch (error) {
    logger.error('Error in getOrCreateUserByUsername', { username, telegramId, error });
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    logger.info('Deleting user and all associated data', { userId });

    // Delete user (this will cascade delete all related data due to foreign keys)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }

    logger.info('User and all associated data deleted successfully', { userId });
    return true;
  } catch (error) {
    logger.error('Error deleting user', { userId, error });
    throw error;
  }
}

// ============================================================================
// Exercises
// ============================================================================

export async function getExerciseByDirectusId(directusId: string): Promise<Exercise | null> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('directus_id', directusId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    logger.error('Error fetching exercise by directus ID', { directusId, error });
    throw error;
  }
}

export async function getAllExercises(): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching all exercises', { error });
    throw error;
  }
}

export async function createExercise(payload: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create exercise');
    }

    logger.info('Exercise created successfully', { exerciseId: data.id });
    return data;
  } catch (error) {
    logger.error('Error creating exercise', { payload, error });
    throw error;
  }
}

export async function upsertExercise(payload: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .upsert([payload], { onConflict: 'directus_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to upsert exercise');
    }

    return data;
  } catch (error) {
    logger.error('Error upserting exercise', { payload, error });
    throw error;
  }
}

// ============================================================================
// User Days
// ============================================================================

export async function getUserDayByDate(userId: string, date: string): Promise<UserDay | null> {
  try {
    const { data, error } = await supabase
      .from('user_days')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    logger.error('Error fetching user day by date', { userId, date, error });
    throw error;
  }
}

export async function getUserDaysForMonth(userId: string, year: number, month: number): Promise<UserDay[]> {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('user_days')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching user days for month', { userId, year, month, error });
    throw error;
  }
}

export async function getAllUserDays(userId: string): Promise<UserDay[]> {
  try {
    const { data, error } = await supabase
      .from('user_days')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching all user days', { userId, error });
    throw error;
  }
}

export async function createUserDay(userId: string, date: string): Promise<UserDay> {
  try {
    const { data, error } = await supabase
      .from('user_days')
      .insert([{ user_id: userId, date }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create user day');
    }

    logger.info('User day created successfully', { userDayId: data.id, userId, date });
    return data;
  } catch (error) {
    logger.error('Error creating user day', { userId, date, error });
    throw error;
  }
}

export async function deleteUserDay(userDayId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_days')
      .delete()
      .eq('id', userDayId);

    if (error) {
      throw error;
    }

    logger.info('User day deleted successfully', { userDayId });
  } catch (error) {
    logger.error('Error deleting user day', { userDayId, error });
    throw error;
  }
}

// ============================================================================
// User Day Workouts
// ============================================================================

export async function getWorkoutSessionsForDay(userDayId: string): Promise<UserDayWorkout[]> {
  try {
    logger.debug('Fetching workout sessions from user_day_workouts', { userDayId });
    const { data, error } = await supabase
      .from('user_day_workouts')
      .select('*')
      .eq('user_day_id', userDayId)
      .order('started_at', { ascending: false });

    if (error) {
      logger.error('Error fetching workout sessions (Supabase error)', { userDayId, error });
      throw error;
    }

    logger.info('Workout sessions fetched from DB', { userDayId, count: data ? data.length : 0, sessions: data });
    return data || [];
  } catch (error) {
    logger.error('Error fetching workout sessions for day', { userDayId, error });
    throw error;
  }
}

export async function createWorkoutSession(userId: string, userDayId: string, startedAt: string): Promise<UserDayWorkout> {
  try {
    logger.debug('Creating workout session', { userId, userDayId, startedAt });
    const { data, error } = await supabase
      .from('user_day_workouts')
      .insert([{ user_id: userId, user_day_id: userDayId, started_at: startedAt }])
      .select()
      .single();

    if (error) {
      logger.error('Supabase error creating workout session', { userId, userDayId, error });
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create workout session - no data returned');
    }

    logger.info('Workout session created successfully in DB', { workoutSessionId: data.id, userId, userDayId, startedAt, fullData: data });
    return data;
  } catch (error) {
    logger.error('Error creating workout session', { userId, userDayId, startedAt, error });
    throw error;
  }
}

export async function deleteWorkoutSession(workoutSessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_day_workouts')
      .delete()
      .eq('id', workoutSessionId);

    if (error) {
      throw error;
    }

    logger.info('Workout session deleted successfully', { workoutSessionId });
  } catch (error) {
    logger.error('Error deleting workout session', { workoutSessionId, error });
    throw error;
  }
}

// ============================================================================
// User Day Exercises
// ============================================================================

export async function getUserDayExercisesByWorkout(workoutSessionId: string): Promise<
  Array<UserDayWorkoutExercise & { exercise: Exercise }>
> {
  try {
    const { data, error } = await supabase
      .from('user_day_workout_exercises')
      .select('*, exercise:exercise_id(*)')
      .eq('user_day_workout_id', workoutSessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching workout exercises', { workoutSessionId, error });
    throw error;
  }
}

// Legacy function for backward compatibility - gets all exercises for a day
// This fetches exercises from all workout sessions for a given user_day
export async function getUserDayExercisesByDay(userDayId: string): Promise<
  Array<UserDayExercise & { exercise: Exercise }>
> {
  try {
    // Get all workout sessions for this day first
    const { data: workoutSessions, error: sessionsError } = await supabase
      .from('user_day_workouts')
      .select('id')
      .eq('user_day_id', userDayId);

    if (sessionsError) {
      throw sessionsError;
    }

    // If no sessions, return empty array
    if (!workoutSessions || workoutSessions.length === 0) {
      return [];
    }

    // Get all exercises from all sessions
    const sessionIds = workoutSessions.map(s => s.id);
    const { data, error } = await supabase
      .from('user_day_workout_exercises')
      .select('*, exercise:exercise_id(*)')
      .in('user_day_workout_id', sessionIds)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching user day exercises', { userDayId, error });
    throw error;
  }
}

export async function createWorkoutExercise(workoutSessionId: string, exerciseId: string): Promise<UserDayWorkoutExercise> {
  try {
    const { data, error } = await supabase
      .from('user_day_workout_exercises')
      .insert([{ user_day_workout_id: workoutSessionId, exercise_id: exerciseId }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create workout exercise');
    }

    logger.info('Workout exercise created successfully', { workoutExerciseId: data.id });
    return data;
  } catch (error) {
    logger.error('Error creating workout exercise', { workoutSessionId, exerciseId, error });
    throw error;
  }
}

// Legacy function for backward compatibility - creates exercise in a new workout session
export async function createUserDayExercise(userDayId: string, exerciseId: string): Promise<UserDayExercise> {
  try {
    // First, get the user_day to get user_id
    const { data: userDay, error: userDayError } = await supabase
      .from('user_days')
      .select('user_id')
      .eq('id', userDayId)
      .single();

    if (userDayError || !userDay) {
      throw userDayError || new Error('User day not found');
    }

    // Create a new workout session for this user day if needed
    const startedAt = new Date().toISOString();
    const { data: workoutSession, error: sessionError } = await supabase
      .from('user_day_workouts')
      .insert([{
        user_id: userDay.user_id,
        user_day_id: userDayId,
        started_at: startedAt
      }])
      .select()
      .single();

    if (sessionError || !workoutSession) {
      throw sessionError || new Error('Failed to create workout session');
    }

    // Now create the exercise in the workout session
    const { data, error } = await supabase
      .from('user_day_workout_exercises')
      .insert([{
        user_day_workout_id: workoutSession.id,
        exercise_id: exerciseId
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create user day exercise');
    }

    logger.info('User day exercise created successfully', { userDayExerciseId: data.id });
    return data as UserDayExercise;
  } catch (error) {
    logger.error('Error creating user day exercise', { userDayId, exerciseId, error });
    throw error;
  }
}

export async function deleteUserDayExercise(userDayExerciseId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_day_workout_exercises')
      .delete()
      .eq('id', userDayExerciseId);

    if (error) {
      throw error;
    }

    logger.info('User day exercise deleted successfully', { userDayExerciseId });
  } catch (error) {
    logger.error('Error deleting user day exercise', { userDayExerciseId, error });
    throw error;
  }
}

// ============================================================================
// User Day Exercise Sets
// ============================================================================

export async function getUserDayExerciseSets(userDayExerciseId: string): Promise<UserDayExerciseSet[]> {
  try {
    const { data, error } = await supabase
      .from('user_day_workout_exercise_sets')
      .select('*')
      .eq('user_day_workout_exercise_id', userDayExerciseId)
      .order('set_order', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching user day exercise sets', { userDayExerciseId, error });
    throw error;
  }
}

export async function createUserDayExerciseSet(payload: {
  user_day_workout_exercise_id: string;
  reps: number;
  weight: number;
  set_order: number;
}): Promise<UserDayExerciseSet> {
  try {
    const { data, error } = await supabase
      .from('user_day_workout_exercise_sets')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create user day exercise set');
    }

    logger.info('User day exercise set created successfully', { setId: data.id });
    return data;
  } catch (error) {
    logger.error('Error creating user day exercise set', { payload, error });
    throw error;
  }
}

export async function deleteUserDayExerciseSet(setId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_day_workout_exercise_sets')
      .delete()
      .eq('id', setId);

    if (error) {
      throw error;
    }

    logger.info('User day exercise set deleted successfully', { setId });
  } catch (error) {
    logger.error('Error deleting user day exercise set', { setId, error });
    throw error;
  }
}
