import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App'
import { PageCacheProvider } from './contexts/PageCacheContext'
import { ExerciseDetailSheetProvider } from './contexts/SheetContext'
import { ProfileSheetProvider } from './contexts/ProfileSheetContext'
import { SettingsSheetProvider } from './contexts/SettingsSheetContext'
import { BugReportSheetProvider } from './contexts/BugReportSheetContext'
import { UserProvider } from './contexts/UserContext'

// Initialize React Query client
// Источник: https://tanstack.com/query/latest/docs/framework/react/overview#setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

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
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <PageCacheProvider>
        <ExerciseDetailSheetProvider>
          <ProfileSheetProvider>
            <SettingsSheetProvider>
              <BugReportSheetProvider>
                <App />
              </BugReportSheetProvider>
            </SettingsSheetProvider>
          </ProfileSheetProvider>
        </ExerciseDetailSheetProvider>
      </PageCacheProvider>
    </UserProvider>
  </QueryClientProvider>
);