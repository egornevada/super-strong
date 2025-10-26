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
