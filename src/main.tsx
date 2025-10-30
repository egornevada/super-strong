import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App'
import { PageCacheProvider } from './contexts/PageCacheContext'
import { ExerciseDetailSheetProvider } from './contexts/SheetContext'
import { ProfileSheetProvider } from './contexts/ProfileSheetContext'
import { SettingsSheetProvider } from './contexts/SettingsSheetContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PageCacheProvider>
      <ExerciseDetailSheetProvider>
        <ProfileSheetProvider>
          <SettingsSheetProvider>
            <App />
          </SettingsSheetProvider>
        </ProfileSheetProvider>
      </ExerciseDetailSheetProvider>
    </PageCacheProvider>
  </StrictMode>
);