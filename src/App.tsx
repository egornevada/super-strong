import { useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { ExercisesPage } from './pages/ExercisesPage';
import { StorybookPage } from './pages/StorybookPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyExercisesPage } from './pages/MyExercisesPage';
import { type Exercise } from './services/directusApi';
import { type Set } from './components';

type PageType = 'exercises' | 'storybook' | 'calendar' | 'myExercises';

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
  const [calendarScrollPosition, setCalendarScrollPosition] = useState(0);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [exercisesWithTrackedSets, setExercisesWithTrackedSets] = useState<Map<string, Set[]>>(new Map());
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<Map<string, ExerciseWithTrackSets[]>>(new Map());
  const [isClosing, setIsClosing] = useState(false);

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
      const newTrackedSets = new Map<string, Set[]>();
      savedExercises.forEach(ex => {
        newTrackedSets.set(ex.id, ex.trackSets);
      });
      setExercisesWithTrackedSets(newTrackedSets);
      setSelectedExercises(savedExercises.map(({ ...ex }) => ex));
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
    setIsClosing(true);
    setTimeout(() => {
      setSelectedExercises(exercises);
      setCurrentPage('myExercises');
      setIsClosing(false);
    }, 300);
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
    const exercisesToSelect: Exercise[] = exercises.map(({ ...ex }) => ex as Exercise);
    setSelectedExercises(exercisesToSelect);
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('exercises');
      setIsClosing(false);
    }, 300);
  };

  const handleGoToStorybook = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('storybook');
      setIsClosing(false);
    }, 300);
  };

  return (
    <div className="flex items-center justify-center w-full h-screen bg-bg-3" style={{ height: '100dvh' }}>
      {/* Responsive mobile viewport container
          - Below 640px: full viewport height with no gaps
          - Above 640px: 24px margins, max height, centered */}
      <div className="relative w-full max-w-[640px] max-sm:h-full sm:h-[calc(100vh-48px)] sm:my-6 bg-bg-3 flex flex-col max-sm:p-0 sm:p-3 sm:rounded-[24px]" style={{ maxHeight: '100dvh' }}>
        {/* Calendar - always in DOM, just hidden */}
        <div
          style={{ display: currentPage === 'calendar' ? 'flex' : 'none' }}
          className={`w-full h-full flex-1 ${currentPage === 'calendar' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
        >
          <CalendarPage
            onDayClick={handleDayClick}
            workoutDays={workoutDays}
            onSettings={handleGoToStorybook}
          />
        </div>

        {/* Exercises */}
        <div
          style={{ display: currentPage === 'exercises' ? 'flex' : 'none' }}
          className={`w-full h-full flex-1 ${currentPage === 'exercises' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
        >
          <ExercisesPage
            selectedDate={selectedDate}
            onBack={handleBackFromExercises}
            onStartTraining={handleGoToMyExercises}
            initialSelectedIds={selectedExercises.map((ex) => ex.id)}
          />
        </div>

        {/* My Exercises */}
        <div
          style={{ display: currentPage === 'myExercises' ? 'flex' : 'none' }}
          className={`w-full h-full flex-1 ${currentPage === 'myExercises' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
        >
          <MyExercisesPage
            selectedExercises={getExercisesWithTrackedSets()}
            selectedDate={selectedDate}
            onBack={handleBackFromMyExercises}
            onSelectMoreExercises={handleSelectMoreExercisesFromMyPage}
            onSave={handleSaveTraining}
          />
        </div>

        {/* Storybook */}
        <div
          style={{ display: currentPage === 'storybook' ? 'flex' : 'none' }}
          className={`w-full h-full flex-1 ${currentPage === 'storybook' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
        >
          <StorybookPage />
        </div>
      </div>

    </div>
  );
}
