import { logger } from '../lib/logger';
import {
  User,
  getUserByUsername as supabaseGetUserByUsername,
  getUserByTelegramId as supabaseGetUserByTelegramId,
  createUser as supabaseCreateUser,
  updateUser as supabaseUpdateUser,
  getOrCreateUserByUsername as supabaseGetOrCreateUserByUsername
} from './supabaseApi';

// Re-export Supabase User interface as UserData for compatibility
export type UserData = User;

export interface CreateUserPayload {
  telegram_id?: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<UserData | null> {
  try {
    return await supabaseGetUserByUsername(username);
  } catch (error) {
    logger.error('Error fetching user by username', { username, error });
    throw error;
  }
}

/**
 * Get user by telegram ID
 */
export async function getUserByTelegramId(telegramId: number): Promise<UserData | null> {
  try {
    return await supabaseGetUserByTelegramId(telegramId);
  } catch (error) {
    logger.error('Error fetching user by telegram ID', { telegramId, error });
    throw error;
  }
}

/**
 * Create new user
 */
export async function createUser(payload: CreateUserPayload): Promise<UserData> {
  try {
    logger.debug('Creating new user', { username: payload.username });

    const user = await supabaseCreateUser({
      username: payload.username,
      telegram_id: payload.telegram_id,
      first_name: payload.first_name,
      last_name: payload.last_name
    });

    if (!user || !user.id) {
      throw new Error('Failed to create user - invalid response');
    }

    logger.info('User created successfully', { userId: user.id, username: payload.username });
    return user;
  } catch (error) {
    logger.error('Error creating user', { payload, error });

    if (error instanceof Error && error.message.includes('duplicate')) {
      throw new Error('Этот никнейм уже занят');
    }

    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(userId: string, payload: Partial<CreateUserPayload>): Promise<UserData> {
  try {
    logger.debug('Updating user', { userId, updates: Object.keys(payload) });

    const user = await supabaseUpdateUser(userId, {
      telegram_id: payload.telegram_id,
      username: payload.username,
      first_name: payload.first_name,
      last_name: payload.last_name
    });

    if (!user || !user.id) {
      throw new Error('Failed to update user - invalid response');
    }

    logger.info('User updated successfully', { userId });
    return user;
  } catch (error) {
    logger.error('Error updating user', { userId, payload, error });
    throw error;
  }
}

/**
 * Get or create user by username
 * If user exists, link Telegram ID if provided
 * If user doesn't exist, create new user
 */
export async function getOrCreateUserByUsername(
  username: string,
  telegramId?: number,
  firstName?: string,
  lastName?: string
): Promise<UserData> {
  try {
    return await supabaseGetOrCreateUserByUsername(username, telegramId, firstName, lastName);
  } catch (error) {
    logger.error('Error in getOrCreateUserByUsername', { username, telegramId, error });
    throw error;
  }
}

/**
 * Save user info to localStorage (persists across page refreshes)
 */
export function saveUserSession(user: UserData): void {
  const session = {
    userId: user.id,
    username: user.username,
    telegramId: user.telegram_id,
    created_at: user.created_at,
    timestamp: Date.now()
  };

  localStorage.setItem('super-strong-user-session', JSON.stringify(session));
  logger.debug('User session saved', { userId: user.id });
}

/**
 * Get saved user session from localStorage
 */
export function getUserSession(): { userId: string; username: string; telegramId?: number; created_at?: string } | null {
  try {
    const sessionJson = localStorage.getItem('super-strong-user-session');
    if (!sessionJson) return null;

    const session = JSON.parse(sessionJson);
    return {
      userId: session.userId,
      username: session.username,
      telegramId: session.telegramId,
      created_at: session.created_at
    };
  } catch (error) {
    logger.error('Error reading user session', error);
    return null;
  }
}

/**
 * Clear user session
 */
export function clearUserSession(): void {
  localStorage.removeItem('super-strong-user-session');
  logger.debug('User session cleared');
}
