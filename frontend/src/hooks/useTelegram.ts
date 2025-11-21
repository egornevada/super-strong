import { useEffect } from 'react';
import { initTelegramApp, getTelegramUser } from '../lib/telegram';

/**
 * Hook to initialize Telegram Web App and get user data
 */
export function useTelegram() {
  useEffect(() => {
    initTelegramApp();
  }, []);

  return {
    user: getTelegramUser(),
  };
}
