import { logger } from '../lib/logger';
import { api, saveJWTToken, clearJWTToken } from '../lib/api';
import {
  User,
  getUserByUsername as supabaseGetUserByUsername,
  getUserByTelegramId as supabaseGetUserByTelegramId,
  createUser as supabaseCreateUser,
  updateUser as supabaseUpdateUser,
  getOrCreateUserByUsername as supabaseGetOrCreateUserByUsername,
  deleteUser as supabaseDeleteUser
} from './supabaseApi';

// Re-export Supabase User interface as UserData for compatibility
export type UserData = User;

/**
 * Backend auth response interface
 */
interface BackendAuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    telegram_id?: string | number;
    username: string;
    first_name?: string;
    last_name?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export interface CreateUserPayload {
  telegram_id?: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Authenticate user via Telegram WebApp with backend
 * Sends initData to backend, receives JWT token
 */
export async function authenticateWithTelegram(initData: string): Promise<{ user: UserData; token: string }> {
  try {
    logger.debug('Authenticating with Telegram backend', { hasInitData: !!initData });

    // Call backend Telegram auth endpoint
    const response = await api.post<BackendAuthResponse>('/api/v1/auth/telegram', {
      init_data: initData
    });

    if (!response?.access_token || !response?.user) {
      throw new Error('Invalid response from backend auth endpoint');
    }

    // Save JWT token for subsequent API calls
    saveJWTToken(response.access_token);
    logger.info('Telegram auth successful', { userId: response.user.id });

    // Convert backend user response to UserData format
    const userData: UserData = {
      id: response.user.id,
      username: response.user.username,
      telegram_id: response.user.telegram_id,
      first_name: response.user.first_name,
      last_name: response.user.last_name,
      created_at: response.user.created_at,
      updated_at: response.user.updated_at
    } as UserData;

    return {
      user: userData,
      token: response.access_token
    };
  } catch (error) {
    logger.error('Telegram authentication failed', { error });
    throw error;
  }
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
 * Create new user via backend API
 */
export async function createUser(payload: CreateUserPayload): Promise<UserData> {
  try {
    logger.debug('Creating new user via backend', { username: payload.username });

    const response = await api.post<UserData>('/supabase-users/create', {
      username: payload.username,
      telegram_id: payload.telegram_id,
      first_name: payload.first_name,
      last_name: payload.last_name
    });

    if (!response || !response.id) {
      throw new Error('Failed to create user - invalid response');
    }

    logger.info('User created successfully via backend', { userId: response.id, username: payload.username });
    return response;
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
 * Get or create user by username via backend API
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
    logger.debug('Getting or creating user via backend', { username, telegramId });

    const response = await api.post<UserData>('/supabase-users/get-or-create', {
      username,
      telegram_id: telegramId,
      first_name: firstName,
      last_name: lastName
    });

    if (!response || !response.id) {
      throw new Error('Invalid response from backend - no user id');
    }

    logger.info('User obtained or created successfully via backend', {
      userId: response.id,
      username
    });

    return response;
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
 * Clear user session and JWT token
 */
export function clearUserSession(): void {
  localStorage.removeItem('super-strong-user-session');
  clearJWTToken();
  logger.debug('User session and JWT token cleared');
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    logger.info('Deleting user account', { userId });

    // Delete from Supabase
    const success = await supabaseDeleteUser(userId);

    if (success) {
      // Clear session from localStorage
      clearUserSession();
      logger.info('User account deleted successfully', { userId });
    }

    return success;
  } catch (error) {
    logger.error('Error deleting user account', { userId, error });
    throw error;
  }
}
