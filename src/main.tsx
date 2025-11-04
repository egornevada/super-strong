import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App'
import { PageCacheProvider } from './contexts/PageCacheContext'
import { ExerciseDetailSheetProvider } from './contexts/SheetContext'
import { ProfileSheetProvider } from './contexts/ProfileSheetContext'
import { SettingsSheetProvider } from './contexts/SettingsSheetContext'

// Log every time app starts
const timestamp = new Date().toLocaleTimeString();
console.log('🚀 APP STARTING AT', timestamp);
console.error('🚀 APP STARTING AT', timestamp);

// Catch unhandled errors
window.addEventListener('error', (event) => {
  console.error('❌ UNCAUGHT ERROR:', event.error);
  console.error('❌ Stack:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ UNHANDLED REJECTION:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <PageCacheProvider>
    <ExerciseDetailSheetProvider>
      <ProfileSheetProvider>
        <SettingsSheetProvider>
          <App />
        </SettingsSheetProvider>
      </ProfileSheetProvider>
    </ExerciseDetailSheetProvider>
  </PageCacheProvider>
);