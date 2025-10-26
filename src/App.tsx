import { useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { ExercisesPage } from './pages/ExercisesPage';
import { StorybookPage } from './pages/StorybookPage';
import { CalendarPage } from './pages/CalendarPage';

type PageType = 'exercises' | 'storybook' | 'calendar';

interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

export default function App() {
  useTelegram();
  const [currentPage, setCurrentPage] = useState<PageType>('calendar');
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [calendarScrollPosition, setCalendarScrollPosition] = useState(0);

  const handleDayClick = (day: number, month: number, year: number) => {
    // Сохраняем позицию скролла календаря перед переходом
    const calendarContainer = document.querySelector('.calendar-scroll-container');
    if (calendarContainer) {
      setCalendarScrollPosition(calendarContainer.scrollTop);
    }
    setSelectedDate({ day, month, year });
    setCurrentPage('exercises');
  };

  const handleBackFromExercises = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('calendar');
      setIsClosing(false);
      // Восстанавливаем позицию скролла после смены страницы
      setTimeout(() => {
        const calendarContainer = document.querySelector('.calendar-scroll-container');
        if (calendarContainer) {
          calendarContainer.scrollTop = calendarScrollPosition;
        }
      }, 0);
    }, 300);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      {/* Mobile viewport container - 375x700px */}
      <div className="relative w-[375px] h-[700px] bg-bg-1 shadow-2xl overflow-hidden rounded-[40px] border-8 border-gray-800">
        {/* Calendar - always in DOM, just hidden */}
        <div style={{ display: currentPage === 'calendar' ? 'flex' : 'none' }} className="w-full h-full">
          <CalendarPage
            onDayClick={handleDayClick}
          />
        </div>

        {/* Exercises - with animation */}
        {currentPage === 'exercises' && (
          <div className={isClosing ? 'slide-out-down' : 'slide-in-up'}>
            <ExercisesPage
              selectedDate={selectedDate}
              onBack={handleBackFromExercises}
            />
          </div>
        )}

        {/* Storybook */}
        {currentPage === 'storybook' && <StorybookPage />}
      </div>

      {/* Page Switcher - floating buttons (outside viewport) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button
          onClick={() => setCurrentPage('calendar')}
          className={`w-14 h-14 rounded-full font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center ${
            currentPage === 'calendar'
              ? 'bg-bg-brand text-fg-inverted shadow-xl'
              : 'bg-bg-3 text-fg-1 hover:bg-bg-2'
          }`}
          aria-label="Calendar"
          title="Go to Calendar"
        >
          📅
        </button>
        <button
          onClick={() => setCurrentPage('exercises')}
          className={`w-14 h-14 rounded-full font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center ${
            currentPage === 'exercises'
              ? 'bg-bg-brand text-fg-inverted shadow-xl'
              : 'bg-bg-3 text-fg-1 hover:bg-bg-2'
          }`}
          aria-label="Exercises"
          title="Go to Exercises"
        >
          💪
        </button>
        <button
          onClick={() => setCurrentPage('storybook')}
          className={`w-14 h-14 rounded-full font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center ${
            currentPage === 'storybook'
              ? 'bg-bg-brand text-fg-inverted shadow-xl'
              : 'bg-bg-3 text-fg-1 hover:bg-bg-2'
          }`}
          aria-label="Storybook"
          title="Go to Storybook"
        >
          📖
        </button>
      </div>
    </div>
  );
}
