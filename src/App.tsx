import { useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { ExercisesPage } from './pages/ExercisesPage';
import { StorybookPage } from './pages/StorybookPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyExercisesPage } from './pages/MyExercisesPage';
import { type Exercise } from './services/directusApi';
import { type Set } from './components';

type PageType = 'exercises' | 'storybook' | 'calendar' | 'myExercises';
type AnimationType = 'slide' | 'dissolve';

interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

interface ExerciseWithTrackSets extends Exercise {
  trackSets: Set[];
}

export default function App() {
  useTelegram();
  const [currentPage, setCurrentPage] = useState<PageType>('calendar');
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType>('slide');
  const [calendarScrollPosition, setCalendarScrollPosition] = useState(0);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [exercisesWithTrackedSets, setExercisesWithTrackedSets] = useState<Map<string, Set[]>>(new Map());
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<Map<string, ExerciseWithTrackSets[]>>(new Map());

  const handleDayClick = (day: number, month: number, year: number) => {
    // Сохраняем позицию скролла календаря перед переходом
    const calendarContainer = document.querySelector('.calendar-scroll-container');
    if (calendarContainer) {
      setCalendarScrollPosition(calendarContainer.scrollTop);
    }
    setSelectedDate({ day, month, year });

    // Проверяем, есть ли сохраненная тренировка для этого дня
    const dateKey = `${day}-${month}-${year}`;
    const savedExercises = savedWorkouts.get(dateKey);

    if (savedExercises && savedExercises.length > 0) {
      // Если есть сохраненная тренировка - переходим на MyExercisesPage
      // Восстанавливаем trackSets из сохраненной тренировки
      const newTrackedSets = new Map<string, Set[]>();
      savedExercises.forEach(ex => {
        newTrackedSets.set(ex.id, ex.trackSets);
      });
      setExercisesWithTrackedSets(newTrackedSets);
      setSelectedExercises(savedExercises.map(({ trackSets, ...ex }) => ex));
      setCurrentPage('myExercises');
    } else {
      // Иначе переходим на ExercisesPage для выбора упражнений
      setSelectedExercises([]);
      setExercisesWithTrackedSets(new Map());
      setCurrentPage('exercises');
    }
  };

  const handleBackFromExercises = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('calendar');
      setIsClosing(false);
      setSelectedExercises([]);
      // Восстанавливаем позицию скролла после смены страницы
      setTimeout(() => {
        const calendarContainer = document.querySelector('.calendar-scroll-container');
        if (calendarContainer) {
          calendarContainer.scrollTop = calendarScrollPosition;
        }
      }, 0);
    }, 300);
  };

  const handleGoToMyExercises = (exercises: Exercise[]) => {
    setSelectedExercises(exercises);
    setAnimationType('dissolve');
    setCurrentPage('myExercises');
  };

  // Получить упражнения с trackSets для MyExercisesPage
  const getExercisesWithTrackedSets = (): ExerciseWithTrackSets[] => {
    return selectedExercises.map(ex => ({
      ...ex,
      trackSets: exercisesWithTrackedSets.get(ex.id) || []
    }));
  };

  const handleSaveTraining = (exercises: ExerciseWithTrackSets[], date: SelectedDate) => {
    // Сохраняем тренировку в Map по дате
    const dateKey = `${date.day}-${date.month}-${date.year}`;
    const newSavedWorkouts = new Map(savedWorkouts);
    newSavedWorkouts.set(dateKey, exercises);
    setSavedWorkouts(newSavedWorkouts);

    // Добавляем день в workoutDays если его там нет
    setWorkoutDays((prev) =>
      prev.includes(date.day) ? prev : [...prev, date.day]
    );

    console.log('Training saved:', { exercises, date });

    // Очищаем временное хранилище trackSets
    setExercisesWithTrackedSets(new Map());

    // Возвращаемся в календарь
    setSelectedExercises([]);
    setCurrentPage('calendar');
  };

  const handleBackFromMyExercises = () => {
    setAnimationType('slide');
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('calendar');
      setIsClosing(false);
      setSelectedExercises([]);
      setExercisesWithTrackedSets(new Map());
      // Восстанавливаем позицию скролла календаря после смены страницы
      setTimeout(() => {
        const calendarContainer = document.querySelector('.calendar-scroll-container');
        if (calendarContainer) {
          calendarContainer.scrollTop = calendarScrollPosition;
        }
      }, 0);
    }, 300);
  };

  const handleSelectMoreExercisesFromMyPage = (exercises: ExerciseWithTrackSets[]) => {
    // Сохраняем trackSets для каждого упражнения перед переходом
    const newTrackedSets = new Map(exercisesWithTrackedSets);
    exercises.forEach(ex => {
      newTrackedSets.set(ex.id, ex.trackSets);
    });
    setExercisesWithTrackedSets(newTrackedSets);

    // Обновляем selectedExercises перед переходом (тип Exercise)
    const exercisesToSelect: Exercise[] = exercises.map(({ trackSets, ...ex }) => ex as Exercise);
    setSelectedExercises(exercisesToSelect);
    setAnimationType('dissolve');
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('exercises');
      setIsClosing(false);
    }, 300);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      {/* Mobile viewport container - 375x700px */}
      <div className="relative w-[375px] h-[700px] bg-bg-1 shadow-2xl overflow-hidden border-8 border-gray-800">
        {/* Calendar - always in DOM, just hidden */}
        <div style={{ display: currentPage === 'calendar' ? 'flex' : 'none' }} className="w-full h-full">
          <CalendarPage
            onDayClick={handleDayClick}
            workoutDays={workoutDays}
          />
        </div>

        {/* Exercises - with animation */}
        {currentPage === 'exercises' && (
          <div className={`w-full h-full ${
            animationType === 'dissolve'
              ? isClosing ? 'dissolve-out' : 'dissolve-in'
              : isClosing ? 'slide-out-down' : 'slide-in-up'
          }`}>
            <ExercisesPage
              selectedDate={selectedDate}
              onBack={handleBackFromExercises}
              onStartTraining={handleGoToMyExercises}
              initialSelectedIds={selectedExercises.map((ex) => ex.id)}
            />
          </div>
        )}

        {/* My Exercises - with animation */}
        {currentPage === 'myExercises' && (
          <div className={`w-full h-full ${
            animationType === 'dissolve'
              ? isClosing ? 'dissolve-out' : 'dissolve-in'
              : isClosing ? 'slide-out-down' : 'slide-in-up'
          }`}>
            <MyExercisesPage
              selectedExercises={getExercisesWithTrackedSets()}
              selectedDate={selectedDate}
              onBack={handleBackFromMyExercises}
              onSelectMoreExercises={handleSelectMoreExercisesFromMyPage}
              onSave={handleSaveTraining}
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
