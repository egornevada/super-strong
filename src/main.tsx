import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App'
import { PageCacheProvider } from './contexts/PageCacheContext'
import { ExerciseDetailSheetProvider } from './contexts/SheetContext'
import { ProfileSheetProvider } from './contexts/ProfileSheetContext'
import { SettingsSheetProvider } from './contexts/SettingsSheetContext'
import { UserProvider } from './contexts/UserContext'

// Initialize Telegram data if available
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const telegramApp = window.Telegram.WebApp;
  const initData = {
    user: telegramApp.initDataUnsafe?.user || null,
    initData: telegramApp.initData || ''
  };
  localStorage.setItem('telegram_init_data', JSON.stringify(initData));
}

createRoot(document.getElementById('root')!).render(
  <UserProvider>
    <PageCacheProvider>
      <ExerciseDetailSheetProvider>
        <ProfileSheetProvider>
          <SettingsSheetProvider>
            <App />
          </SettingsSheetProvider>
        </ProfileSheetProvider>
      </ExerciseDetailSheetProvider>
    </PageCacheProvider>
  </UserProvider>
);