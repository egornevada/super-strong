/**
 * Telegram Web App API utilities
 * Safely interact with Telegram Bot API from the Mini App
 */

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  setBackgroundColor: (color: string) => void;
  setHeaderColor: (color: string) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (options: Record<string, unknown>) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick?: (callback: () => void) => void;
  };
  onEvent?: (eventType: string, callback: () => void) => void;
  offEvent?: (eventType: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

/**
 * Get Telegram WebApp instance safely
 * Returns null if not running in Telegram Mini App context
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Initialize Telegram Mini App
 * Should be called early in app lifecycle
 */
export function initTelegramApp() {
  const app = getTelegramWebApp();
  if (app) {
    app.ready();
    app.expand();
    // Set header color to match our theme
    app.setHeaderColor('#FFFFFF');
    return true;
  }
  return false;
}

/**
 * Get current user info from Telegram
 */
export function getTelegramUser() {
  const app = getTelegramWebApp();
  return app?.initDataUnsafe?.user || null;
}

/**
 * Get init data for sending to backend
 */
export function getTelegramInitData() {
  const app = getTelegramWebApp();
  return app?.initData || '';
}

/**
 * Show alert in Telegram style
 */
export function showTelegramAlert(message: string) {
  const app = getTelegramWebApp();
  if (app) {
    app.showAlert(message);
  } else {
    alert(message);
  }
}

/**
 * Show confirmation dialog in Telegram style
 */
export function showTelegramConfirm(
  message: string,
  onConfirm?: (confirmed: boolean) => void
) {
  const app = getTelegramWebApp();
  if (app) {
    app.showConfirm(message, onConfirm);
  } else {
    const confirmed = confirm(message);
    onConfirm?.(confirmed);
  }
}

/**
 * Close the Telegram Mini App
 */
export function closeTelegramApp() {
  const app = getTelegramWebApp();
  if (app) {
    app.close();
  } else {
    window.close();
  }
}

/**
 * Show/hide Telegram back button and handle clicks
 */
export function setupTelegramBackButton(onBack?: () => void) {
  const app = getTelegramWebApp();
  if (!app) return;

  app.BackButton?.show?.();

  if (onBack) {
    app.onEvent?.('backButtonClicked', onBack);
  }

  return () => {
    app.BackButton?.hide?.();
    if (onBack) {
      app.offEvent?.('backButtonClicked', onBack);
    }
  };
}

/**
 * Delete user account via Supabase and close app
 * Returns true if successful, false otherwise
 */
export async function deleteAccountAndClose(): Promise<boolean> {
  try {
    // Import auth API
    const { getUserSession, deleteUserAccount } = await import('../services/authApi');

    // Get current user from session
    const session = getUserSession();
    if (!session || !session.userId) {
      throw new Error('No user session found');
    }

    // Delete user account from Supabase
    await deleteUserAccount(session.userId);

    // Clear all local data
    localStorage.clear();
    sessionStorage.clear();

    // Close the app
    closeTelegramApp();

    return true;
  } catch (error) {
    console.error('[Telegram] Failed to delete account:', error);
    showTelegramAlert('Ошибка при удалении аккаунта. Попробуйте позже.');
    return false;
  }
}
