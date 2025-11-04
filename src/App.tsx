import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useSettingsSheet } from './contexts/SettingsSheetContext';
import { syncPendingRequests, isOnline } from './lib/api';
import { logger } from './lib/logger';
import { getWorkoutsForDate, getWorkoutSetsForDay } from './services/workoutsApi';
import { fetchExercises, fetchExerciseById } from './services/directusApi';
import { ExercisesPage } from './pages/ExercisesPage';
import { StorybookPage } from './pages/StorybookPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyExercisesPage } from './pages/MyExercisesPage';
import { type Exercise } from './services/directusApi';
import { type Set, UsernameModal } from './components';
import { ExerciseDetailSheetRenderer } from './components/SheetRenderer';
import { ProfileSheetRenderer } from './components/ProfileSheetRenderer';
import { SettingsSheetRenderer } from './components/SettingsSheetRenderer';
import { recordProfileWorkout } from './lib/profileStats';
import {
  getOrCreateUserByUsername,
  saveUserSession,
  getUserSession
} from './services/authApi';

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
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameModalError, setUsernameModalError] = useState('');
  const [usernameModalLoading, setUsernameModalLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Cache for exercises loaded by ID to avoid redundant API calls
  const exerciseCacheRef = useRef<Map<string, Exercise>>(new Map());

  // Load workouts after user is initialized
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const handleLoadWorkouts = async () => {
      try {
        // Load exercises cache for displaying saved workouts
        const exercisesData = await fetchExercises();
        setAllExercises(exercisesData);
        logger.info('Exercises cache loaded', { count: exercisesData.length });

        if (isOnline()) {
          logger.info('User initialized, syncing pending requests...');
          const syncResult = await syncPendingRequests();
          const { synced, failed } = syncResult;
          if (synced > 0) {
            logger.info(`Sync complete: ${synced} synced, ${failed} failed`);
          } else if (failed > 0) {
            logger.info(`Sync had failures: 0 synced, ${failed} failed`);
          } else {
            logger.info('Sync skipped (no auth) or nothing to sync');
          }

          // Load workouts for current month and adjacent months
          logger.info('Loading workouts for current and adjacent months...');
          const today = new Date();
          let currentYear = today.getFullYear();
          let currentMonth = today.getMonth();

          // Load previous month
          let prevMonth = currentMonth - 1;
          let prevYear = currentYear;
          if (prevMonth < 0) {
            prevMonth = 11;
            prevYear = currentYear - 1;
          }
          await loadWorkoutsForCurrentMonth(prevMonth, prevYear);

          // Load current month
          await loadWorkoutsForCurrentMonth(currentMonth, currentYear);

          // Load next month
          let nextMonth = currentMonth + 1;
          let nextYear = currentYear;
          if (nextMonth > 11) {
            nextMonth = 0;
            nextYear = currentYear + 1;
          }
          await loadWorkoutsForCurrentMonth(nextMonth, nextYear);

          logger.info('Workouts loading complete');
        } else {
          logger.info('App offline, skipping sync and workout load');
        }
      } catch (error) {
        logger.error('Error loading workouts:', error);
      }
    };

    // Handle app coming back online
    window.addEventListener('online', handleLoadWorkouts);

    // Load workouts when user is first initialized
    handleLoadWorkouts();

    return () => window.removeEventListener('online', handleLoadWorkouts);
  }, [isInitialized]);

  // Initialize user - check for existing session or Telegram
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Check if user already has session
        const existingSession = getUserSession();
        if (existingSession) {
          logger.info('User session found', { userId: existingSession.userId });
          setIsInitialized(true);
          return;
        }

        // Check if Telegram data is available
        const telegramInitData = localStorage.getItem('telegram_init_data');
        if (telegramInitData) {
          try {
            const data = JSON.parse(telegramInitData);
            if (data.user) {
              const telegramUser = data.user;
              logger.info('Telegram user found', { telegramId: telegramUser.id });

              // Use Telegram username or ID as identifier
              const username = telegramUser.username || `user_${telegramUser.id}`;

              // Get or create user
              const user = await getOrCreateUserByUsername(
                username,
                telegramUser.id,
                telegramUser.first_name,
                telegramUser.last_name
              );

              // Save session
              saveUserSession(user);
              logger.info('User authenticated via Telegram', { userId: user.id });
              setIsInitialized(true);
              return;
            }
          } catch (err) {
            logger.debug('Failed to parse Telegram data', err);
          }
        }

        // No session and no Telegram - show username modal
        logger.info('No Telegram data, showing username modal');
        setShowUsernameModal(true);
      } catch (error) {
        logger.error('Error initializing user', error);
        setUsernameModalError('Ошибка инициализации. Попробуйте снова.');
      }
    };

    initializeUser();
  }, []);

  // Handle username modal confirmation
  const handleUsernameConfirm = async (username: string) => {
    try {
      setUsernameModalLoading(true);
      setUsernameModalError('');

      logger.info('Creating/connecting user with username', { username });

      // Get or create user
      const user = await getOrCreateUserByUsername(username);

      // Save session
      saveUserSession(user);

      logger.info('User authenticated via username', { userId: user.id });

      setShowUsernameModal(false);
      setIsInitialized(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка подключения';
      setUsernameModalError(errorMessage);
      logger.error('Error confirming username', error);
    } finally {
      setUsernameModalLoading(false);
    }
  };

  // Load workouts for a specific month (defaults to current month if not specified)
  const loadWorkoutsForCurrentMonth = useCallback(async (month?: number, year?: number) => {
    try {
      logger.info('loadWorkoutsForCurrentMonth: START', { month, year });

      const today = new Date();
      const targetYear = year ?? today.getFullYear();
      const targetMonth = month ?? today.getMonth();

      // Load workouts for the specified month
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
      logger.info('loadWorkoutsForCurrentMonth: Fetching date', { dateStr });

      const workouts = await getWorkoutsForDate(dateStr);
      logger.info('loadWorkoutsForCurrentMonth: Got workouts', { count: workouts.length });

      // Extract unique days that have workouts
      const newDaysWithWorkouts = new Set<string>();
      workouts.forEach((workout) => {
        const dateField = workout.workout_date;

        if (!dateField) {
          logger.warn('Workout has no date field', { id: workout.id });
          return;
        }

        const parts = dateField.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const workoutMonth = parseInt(parts[1], 10) - 1;
          const workoutYear = parseInt(parts[0], 10);
          newDaysWithWorkouts.add(`${day}-${workoutMonth}-${workoutYear}`);
        }
      });

      // Accumulate workouts - merge new ones with existing ones
      setWorkoutDays((prev) => {
        const merged = new Set(prev);
        newDaysWithWorkouts.forEach(day => merged.add(day));
        return Array.from(merged);
      });
      logger.info('Workouts loaded from server', { count: workouts.length });
    } catch (error) {
      logger.error('Failed to load workouts from server', error);
      // Silently fail - use local data if available
    }
  }, []);

  // Handle month changes in calendar - load adjacent months on demand
  const handleCalendarMonthChange = useCallback(async (month: number, year: number) => {
    logger.info('Calendar month changed', { month, year });

    // Load previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = year - 1;
    }
    await loadWorkoutsForCurrentMonth(prevMonth, prevYear);

    // Load current month
    await loadWorkoutsForCurrentMonth(month, year);

    // Load next month
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear = year + 1;
    }
    await loadWorkoutsForCurrentMonth(nextMonth, nextYear);
  }, [loadWorkoutsForCurrentMonth]);
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [calendarScrollPosition, setCalendarScrollPosition] = useState(0);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [exercisesWithTrackedSets, setExercisesWithTrackedSets] = useState<Map<string, Set[]>>(new Map());
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<Map<string, ExerciseWithTrackSets[]>>(new Map());
  const [isClosing, setIsClosing] = useState(false);

  const handleDayClick = async (day: number, month: number, year: number) => {
    // Сохраняем позицию скролла календаря перед переходом
    const calendarContainer = document.querySelector('.calendar-scroll-container');
    if (calendarContainer) {
      setCalendarScrollPosition(calendarContainer.scrollTop);
    }
    setSelectedDate({ day, month, year });

    // Load data from server for this day
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const workoutData = await getWorkoutSetsForDay(dateStr);

    if (workoutData && workoutData.exerciseSets.size > 0) {
      // Есть сохранённая тренировка - загружаем упражнения и подходы
      logger.info('Loading saved workout for day', { date: dateStr, exerciseCount: workoutData.exerciseSets.size });

      const exercisesWithSets: ExerciseWithTrackSets[] = [];

      // Для каждого упражнения в workout_sets
      for (const [exerciseId, sets] of workoutData.exerciseSets) {
        // Get exercise from cache/selected/directus with proper priority
        const exercise = await getExerciseById(exerciseId);

        if (exercise) {
          // Преобразуем WorkoutSetData в Set format
          const trackSets: Set[] = sets.map(set => ({
            reps: set.reps,
            weight: set.weight
          }));

          exercisesWithSets.push({
            ...exercise,
            trackSets
          });
        } else {
          logger.warn('Failed to load exercise after all attempts', { exerciseId });
        }
      }

      // Обновляем локальный Map для отображения
      const newTrackedSets = new Map<string, Set[]>();
      exercisesWithSets.forEach(ex => {
        // Ensure ID is string for consistent storage
        newTrackedSets.set(String(ex.id), ex.trackSets);
      });

      setExercisesWithTrackedSets(newTrackedSets);
      setSelectedExercises(exercisesWithSets);
      setCurrentPage('tracking');
    } else {
      // Нет сохранённых упражнений - переходим на ExercisesPage для выбора
      logger.info('No saved workout for day, showing exercise selection', { date: dateStr });
      setSelectedExercises([]);
      setExercisesWithTrackedSets(new Map());
      setCurrentPage('exercises');
    }
  };

  const handleBackFromExercises = () => {
    logger.warn('[PAGE] handleBackFromExercises called');
    const stack = new Error().stack;
    logger.warn('[PAGE] Stack trace', { stack });
    setIsClosing(true);
    setTimeout(() => {
      logger.warn('[PAGE] Setting currentPage to calendar');
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
    logger.warn('[PAGE] handleGoToMyExercises called', { exerciseCount: exercises.length });
    setIsClosing(true);
    setTimeout(() => {
      setSelectedExercises(exercises);
      logger.warn('[PAGE] Setting currentPage to tracking');
      setCurrentPage('tracking');
      setIsClosing(false);
    }, 300);
  };

  // Helper: Get exercise by ID from multiple sources
  const getExerciseById = async (id: string): Promise<Exercise | null> => {
    // 1. Check cache first
    if (exerciseCacheRef.current.has(id)) {
      return exerciseCacheRef.current.get(id) || null;
    }

    // 2. Check in selectedExercises (exercises user already selected)
    const selectedEx = selectedExercises.find(ex => String(ex.id) === id);
    if (selectedEx) {
      exerciseCacheRef.current.set(id, selectedEx);
      return selectedEx;
    }

    // 3. Check in allExercises cache
    const cachedEx = allExercises.find(ex => String(ex.id) === id);
    if (cachedEx) {
      exerciseCacheRef.current.set(id, cachedEx);
      return cachedEx;
    }

    // 4. Load from Directus if not found anywhere
    try {
      const exercise = await fetchExerciseById(id);
      exerciseCacheRef.current.set(id, exercise);
      return exercise;
    } catch (error) {
      logger.warn('Failed to load exercise from Directus', { id, error });
      return null;
    }
  };

  // Получить упражнения с trackSets для MyExercisesPage
  // Мемоизируем результат чтобы избежать перезаписи локального состояния в MyExercisesPage
  const exercisesWithTrackedSetsMemo = useMemo(() => {
    return selectedExercises.map(ex => {
      // Ensure ID is string for consistent lookup
      const exerciseId = String(ex.id);
      const trackSets = exercisesWithTrackedSets.get(exerciseId) || [];
      return {
        ...ex,
        trackSets
      };
    });
  }, [selectedExercises, exercisesWithTrackedSets]);

  const handleSaveTraining = (exercises: ExerciseWithTrackSets[], date: SelectedDate) => {
    // Сохраняем тренировку в Map по дате
    const dateKey = `${date.day}-${date.month}-${date.year}`;
    const newSavedWorkouts = new Map(savedWorkouts);
    newSavedWorkouts.set(dateKey, exercises);
    setSavedWorkouts(newSavedWorkouts);

    // NOTE: Do NOT update exercisesWithTrackedSets here!
    // It causes MyExercisesPage's useEffect to overwrite local state with empty trackSets.
    // MyExercisesPage maintains its own state during editing.

    // Добавляем полную дату в workoutDays если её там нет
    setWorkoutDays((prev) =>
      prev.includes(dateKey) ? prev : [...prev, dateKey]
    );

    if (date) {
      const workoutDate = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
      recordProfileWorkout(
        workoutDate,
        exercises.map(({ trackSets }) => ({ trackSets }))
      );
    }

    // Don't navigate away - user stays on tracking page to continue adding exercises
  };

  const handleBackFromMyExercises = () => {
    logger.warn('[PAGE] handleBackFromMyExercises called');
    const stack = new Error().stack;
    logger.warn('[PAGE] Stack trace', { stack });
    setIsClosing(true);
    setTimeout(() => {
      logger.warn('[PAGE] Setting currentPage to calendar');
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
    logger.warn('[PAGE] handleSelectMoreExercisesFromMyPage called', { exerciseCount: exercises.length });
    // Сохраняем trackSets для каждого упражнения перед переходом
    const newTrackedSets = new Map(exercisesWithTrackedSets);
    exercises.forEach(ex => {
      // Ensure ID is string for consistent storage
      newTrackedSets.set(String(ex.id), ex.trackSets);
    });
    setExercisesWithTrackedSets(newTrackedSets);

    // Обновляем selectedExercises перед переходом (тип Exercise)
    const exercisesToSelect: Exercise[] = exercises.map(({ ...ex }) => ex as Exercise);
    setSelectedExercises(exercisesToSelect);
    setIsClosing(true);
    setTimeout(() => {
      logger.warn('[PAGE] Setting currentPage to exercises');
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

  // Log currentPage changes
  useEffect(() => {
    logger.warn('[PAGE] currentPage changed to:', { currentPage });
  }, [currentPage]);


  return (
    <div className="flex items-center justify-center w-full h-screen bg-bg-3" style={{ height: '100dvh' }}>
      {/* Responsive mobile viewport container
          - Below 640px: full viewport height with no gaps
          - Above 640px: 24px margins, max height, centered */}
      <div className="relative w-full max-w-[640px] max-sm:h-full sm:h-[calc(100vh-48px)] sm:my-6 bg-bg-3 flex flex-col max-sm:p-0 sm:p-3 sm:rounded-[24px]" style={{ maxHeight: '100dvh' }}>
        {isInitialized ? (
          <>
            {/* Calendar - always in DOM, just hidden */}
            <div
              style={{ display: currentPage === 'calendar' ? 'flex' : 'none' }}
              className={`w-full h-full flex-1 ${currentPage === 'calendar' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
            >
              <CalendarPage
                onDayClick={handleDayClick}
                onMonthChange={handleCalendarMonthChange}
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
                selectedExercises={exercisesWithTrackedSetsMemo}
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

            {/* Sheet overlays */}
            <ExerciseDetailSheetRenderer />
            <ProfileSheetRenderer />
            <SettingsSheetRenderer />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-bg-2 border-t-brand-500 rounded-full animate-spin" />
              <p className="text-fg-3 text-sm">Загрузка...</p>
            </div>
          </div>
        )}
      </div>

      {/* Username Modal for non-Telegram users */}
      <UsernameModal
        isOpen={showUsernameModal}
        isLoading={usernameModalLoading}
        error={usernameModalError}
        onConfirm={handleUsernameConfirm}
      />
    </div>
  );
}
