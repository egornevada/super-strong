import { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useSettingsSheet } from './contexts/SettingsSheetContext';
import { syncPendingRequests, isOnline } from './lib/api';
import { logger } from './lib/logger';
import { getWorkoutsForDate } from './services/workoutsApi';
import { ExercisesPage } from './pages/ExercisesPage';
import { StorybookPage } from './pages/StorybookPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyExercisesPage } from './pages/MyExercisesPage';
import { type Exercise } from './services/directusApi';
import { type Set } from './components';
import { ExerciseDetailSheetRenderer } from './components/SheetRenderer';
import { ProfileSheetRenderer } from './components/ProfileSheetRenderer';
import { SettingsSheetRenderer } from './components/SettingsSheetRenderer';
import { recordProfileWorkout } from './lib/profileStats';

type PageType = 'calendar' | 'exercises' | 'tracking' | 'storybook';

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
  const { setOnGoToStorybook } = useSettingsSheet();
  const [currentPage, setCurrentPage] = useState<PageType>('calendar');

  // Sync pending requests and load workouts when app loads or comes back online
  useEffect(() => {
    const handleOnline = async () => {
      try {
        if (isOnline()) {
          logger.info('App is online, syncing pending requests...');
          const syncResult = await syncPendingRequests();
          const { synced, failed } = syncResult;
          if (synced > 0) {
            logger.info(`Sync complete: ${synced} synced, ${failed} failed`);
          } else if (failed > 0) {
            logger.info(`Sync had failures: 0 synced, ${failed} failed`);
          } else {
            logger.info('Sync skipped (no auth) or nothing to sync');
          }

          // Load workouts for current month after sync
          logger.info('Loading workouts for current month...');
          await loadWorkoutsForCurrentMonth();
          logger.info('Workouts loading complete');
        } else {
          logger.info('App offline, skipping sync and workout load');
        }
      } catch (error) {
        logger.error('Error in app initialization:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    handleOnline(); // Try sync on initial load

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Load workouts for the current month
  const loadWorkoutsForCurrentMonth = async () => {
    try {
      logger.info('loadWorkoutsForCurrentMonth: START');

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();

      // Load workouts for current month (just a sample - can be optimized)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      logger.info('loadWorkoutsForCurrentMonth: Fetching date', { dateStr });

      const workouts = await getWorkoutsForDate(dateStr);
      logger.info('loadWorkoutsForCurrentMonth: Got workouts', { count: workouts.length });

      logger.info('Raw API response - Workouts count:', workouts.length);
      workouts.forEach((w, i) => {
        logger.info(`  Workout ${i}:`, {
          workout_date: w.workout_date,
          fields: Object.keys(w),
          sets_count: w.sets?.length || 0
        });
      });

      // Extract unique days that have workouts
      const daysWithWorkouts = new Set<string>();
      workouts.forEach((workout, idx) => {
        logger.info(`Processing workout ${idx}:`, {
          workout_date: workout.workout_date,
          has_sets: !!workout.sets
        });

        // API returns workout_date (snake_case)
        const dateField = workout.workout_date;

        if (!dateField) {
          logger.warn(`Workout ${idx} has no date field`, workout);
          return;
        }

        const parts = dateField.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const workoutMonth = parseInt(parts[1], 10) - 1;
          const workoutYear = parseInt(parts[0], 10);
          daysWithWorkouts.add(`${day}-${workoutMonth}-${workoutYear}`);
        }
      });

      setWorkoutDays(Array.from(daysWithWorkouts));
      logger.info('Workouts loaded from server', { count: workouts.length });
    } catch (error) {
      logger.error('Failed to load workouts from server', error);
      // Silently fail - use local data if available
    }
  };
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [calendarScrollPosition, setCalendarScrollPosition] = useState(0);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [exercisesWithTrackedSets, setExercisesWithTrackedSets] = useState<Map<string, Set[]>>(new Map());
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
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
      setCurrentPage('tracking');
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
      setCurrentPage('tracking');
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

    // Добавляем полную дату в workoutDays если её там нет
    setWorkoutDays((prev) =>
      prev.includes(dateKey) ? prev : [...prev, dateKey]
    );

    console.log('Training saved:', { exercises, date });

    // Очищаем временное хранилище trackSets
    setExercisesWithTrackedSets(new Map());

    if (date) {
      const workoutDate = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
      recordProfileWorkout(
        workoutDate,
        exercises.map(({ trackSets }) => ({ trackSets }))
      );
    }

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

  const handleBackFromStorybook = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('calendar');
      setIsClosing(false);
    }, 300);
  };

  useEffect(() => {
    setOnGoToStorybook(() => handleGoToStorybook);
  }, [setOnGoToStorybook]);


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

        {/* Tracking (My Exercises) */}
        <div
          style={{ display: currentPage === 'tracking' ? 'flex' : 'none' }}
          className={`w-full h-full flex-1 ${currentPage === 'tracking' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
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
          <StorybookPage onBack={handleBackFromStorybook} />
        </div>
      </div>

      {/* Sheet overlays */}
      <ExerciseDetailSheetRenderer />
      <ProfileSheetRenderer />
      <SettingsSheetRenderer />
    </div>
  );
}
