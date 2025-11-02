import { api } from '../lib/api';
import { logger } from '../lib/logger';

export interface UserData {
  id: number;
  telegram_id?: number;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

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
    const response = await api.get<UserData[]>(`/users?username=eq.${encodeURIComponent(username)}`);

    if (response && response.length > 0) {
      return response[0];
    }

    return null;
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
    const response = await api.get<UserData[]>(`/users?telegram_id=eq.${telegramId}`);

    if (response && response.length > 0) {
      return response[0];
    }

    return null;
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

    const response = await api.post<UserData | UserData[]>('/users', payload);

    // PostgREST with Prefer: return=representation returns array
    const user = Array.isArray(response) ? response[0] : response;

    if (!user || !user.id) {
      throw new Error('Failed to create user - invalid response');
    }

    logger.info('User created successfully', { userId: user.id, username: payload.username });
    return user;
  } catch (error) {
    logger.error('Error creating user', { payload, error });

    if (error instanceof Error && error.message.includes('duplicate key')) {
      throw new Error('Этот никнейм уже занят');
    }

    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(userId: number, payload: Partial<CreateUserPayload>): Promise<UserData> {
  try {
    logger.debug('Updating user', { userId, updates: Object.keys(payload) });

    const response = await api.patch<UserData | UserData[]>(`/users?id=eq.${userId}`, payload);

    // PostgREST with Prefer: return=representation returns array
    const user = Array.isArray(response) ? response[0] : response;

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
    // Check if user exists by username
    const existingUser = await getUserByUsername(username);

    if (existingUser) {
      logger.debug('User found', { userId: existingUser.id, username });

      // If telegram ID provided and user doesn't have it, update
      if (telegramId && !existingUser.telegram_id) {
        logger.debug('Linking Telegram ID to existing user', { userId: existingUser.id, telegramId });
        return updateUser(existingUser.id, { telegram_id: telegramId });
      }

      return existingUser;
    }

    // Create new user
    logger.debug('User not found, creating new user', { username, telegramId });

    const newUser = await createUser({
      username,
      telegram_id: telegramId,
      first_name: firstName,
      last_name: lastName
    });

    return newUser;
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
    timestamp: Date.now()
  };

  localStorage.setItem('super-strong-user-session', JSON.stringify(session));
  logger.debug('User session saved', { userId: user.id });
}

/**
 * Get saved user session from localStorage
 */
export function getUserSession(): { userId: number; username: string; telegramId?: number } | null {
  try {
    const sessionJson = localStorage.getItem('super-strong-user-session');
    if (!sessionJson) return null;

    const session = JSON.parse(sessionJson);
    return {
      userId: session.userId,
      username: session.username,
      telegramId: session.telegramId
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
