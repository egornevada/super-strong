import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useUser } from './contexts/UserContext';
import { syncPendingRequests, isOnline } from './lib/api';
import { logger } from './lib/logger';
import { getWorkoutsForDate, getWorkoutSetsForDay, deleteWorkout, getAllWorkoutsForUser } from './services/workoutsApi';
import { fetchExercises } from './services/directusApi';
import { syncExercisesFromDirectus } from './services/exerciseSyncService';
import { ExercisesPage } from './pages/ExercisesPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyExercisesPage } from './pages/MyExercisesPage';
import { type Exercise } from './services/directusApi';
import { type Set, UsernameModal } from './components';
import { ExerciseDetailSheetRenderer } from './components/SheetRenderer';
import { ProfileSheetRenderer } from './components/ProfileSheetRenderer';
import { SettingsSheetRenderer } from './components/SettingsSheetRenderer';
import { recordProfileWorkout, recalculateStatsFromSavedWorkouts } from './lib/profileStats';
import {
  getOrCreateUserByUsername,
  saveUserSession,
  getUserSession
} from './services/authApi';

type PageType = 'calendar' | 'exercises' | 'tracking';

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
  const { currentUser, setCurrentUser } = useUser();
  const [currentPage, setCurrentPage] = useState<PageType>('calendar');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameModalError, setUsernameModalError] = useState('');
  const [usernameModalLoading, setUsernameModalLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const initializationAttempt = useRef(0);

  // Reset initialization attempt when user changes
  useEffect(() => {
    initializationAttempt.current = 0;
  }, [currentUser?.id]);

  // Load workouts after user is initialized
  useEffect(() => {
    if (!isInitialized || !currentUser?.id) {
      logger.debug('Waiting for initialization', { isInitialized, hasUser: !!currentUser?.id });
      return;
    }

    const initializeApp = async () => {
      try {
        initializationAttempt.current++;
        if (initializationAttempt.current > 1) {
          return;
        }

        setIsLoadingWorkouts(true);
        setLoadingProgress(10);

        // Restore saved workouts from localStorage
        try {
          const savedWorkoutsStr = localStorage.getItem('savedWorkouts');
          if (savedWorkoutsStr) {
            const savedWorkoutsData = JSON.parse(savedWorkoutsStr);
            const newSavedWorkouts = new Map<string, ExerciseWithTrackSets[]>();
            Object.entries(savedWorkoutsData).forEach(([key, value]) => {
              newSavedWorkouts.set(key, value as ExerciseWithTrackSets[]);
            });
            setSavedWorkouts(newSavedWorkouts);
          }
        } catch (error) {
          // Silently fail
        }

        setLoadingProgress(20);

        // Load exercises cache
        const exercisesData = await fetchExercises();
        setAllExercises(exercisesData);
        setLoadingProgress(30);

        // Sync exercises from Directus to Supabase
        if (isOnline()) {
          try {
            await syncExercisesFromDirectus();
          } catch (error) {
            // Continue anyway - exercises are still available from Directus
          }
        }

        setLoadingProgress(40);

        if (!isOnline()) {
          setIsLoadingWorkouts(false);
          setLoadingProgress(0);
          return;
        }

        // Load all workouts from server and recalculate stats
        try {
          const allWorkoutsFromServer = await getAllWorkoutsForUser(currentUser?.id);
          setLoadingProgress(50);
          const serverWorkoutsMap = new Map<string, Array<{ trackSets: Set[] }>>();
          const serverExercisesMap = new Map<string, ExerciseWithTrackSets[]>();

          if (allWorkoutsFromServer.length > 0) {
            // Convert server workouts to the format expected by recalculateStatsFromSavedWorkouts
            for (const workout of allWorkoutsFromServer) {
              if (!workout.id) continue;

              const dateStr = workout.date;
              const parts = dateStr.split('-');
              if (parts.length !== 3) continue;

              const day = parseInt(parts[2], 10);
              const month = parseInt(parts[1], 10) - 1;
              const year = parseInt(parts[0], 10);
              const dateKey = `${day}-${month}-${year}`;

              // Get sets for this workout
              try {
                const setsData = await getWorkoutSetsForDay(dateStr, currentUser?.id);
                if (setsData && setsData.exercises.size > 0) {
                  const exercises: Array<{ trackSets: Set[] }> = [];
                  const exercisesWithInfo: ExerciseWithTrackSets[] = [];

                  for (const [directusExerciseId, workoutExercise] of setsData.exercises) {
                    const exerciseSets = setsData.exerciseSets.get(directusExerciseId) || [];
                    const trackSets = exerciseSets.map(set => ({
                      reps: set.reps,
                      weight: set.weight
                    }));

                    exercises.push({ trackSets });

                    // Get exercise info for display
                    let exerciseInfo = allExercises.find(ex => String(ex.id) === directusExerciseId);
                    if (!exerciseInfo) {
                      const exerciseName = (workoutExercise as any).exercise?.name || 'Unknown Exercise';
                      exerciseInfo = {
                        id: directusExerciseId,
                        name: exerciseName,
                        category: (workoutExercise as any).exercise?.category || 'Unknown',
                        description: (workoutExercise as any).exercise?.description || ''
                      };
                    }

                    exercisesWithInfo.push({
                      ...exerciseInfo,
                      trackSets
                    });
                  }

                  if (exercises.length > 0) {
                    serverWorkoutsMap.set(dateKey, exercises);
                    serverExercisesMap.set(dateKey, exercisesWithInfo);
                  }
                }
              } catch (err) {
                // Silently fail
              }
            }
          }

          // Update savedWorkouts with server data for UI display
          setSavedWorkouts(serverExercisesMap);

          // Always recalculate profile stats from server workouts (even if empty)
          // This ensures stats are synced across browsers
          recalculateStatsFromSavedWorkouts(serverWorkoutsMap, currentUser?.created_at);
        } catch (err) {
          // Silently fail
        }

        setLoadingProgress(70);

        // Sync pending requests
        try {
          await syncPendingRequests();
        } catch (syncError) {
          // Continue anyway
        }

        setLoadingProgress(85);

        // Load current month workouts
        const today = new Date();
        try {
          await loadWorkoutsForCurrentMonth(today.getMonth(), today.getFullYear());
        } catch (loadError) {
          // Continue anyway
        }

        setLoadingProgress(100);
        setIsLoadingWorkouts(false);
        setLoadingProgress(0);
      } catch (error) {
        setIsLoadingWorkouts(false);
        setLoadingProgress(0);
      }
    };

    initializeApp();
  }, [isInitialized, currentUser?.id]);

  // Initialize user - check for existing session or Telegram
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Check if user already has session
        const existingSession = getUserSession();
        if (existingSession) {
          // Restore user in context from session
          const user = {
            id: existingSession.userId,
            username: existingSession.username,
            telegram_id: existingSession.telegramId,
            created_at: existingSession.created_at || new Date().toISOString(),
            updated_at: existingSession.created_at || new Date().toISOString(),
            first_name: undefined,
            last_name: undefined
          };
          setCurrentUser(user);
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

              // Use Telegram username or ID as identifier
              const username = telegramUser.username || `user_${telegramUser.id}`;

              // Get or create user
              const user = await getOrCreateUserByUsername(
                username,
                telegramUser.id,
                telegramUser.first_name,
                telegramUser.last_name
              );

              // Set current user in context and save session for persistence
              setCurrentUser(user);
              saveUserSession(user);
              setIsInitialized(true);
              return;
            }
          } catch (err) {
            // Failed to parse
          }
        }

        // No session and no Telegram - show username modal
        setShowUsernameModal(true);
      } catch (error) {
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

      // Get or create user
      const user = await getOrCreateUserByUsername(username);

      // Set current user in context
      setCurrentUser(user);

      // Save session to localStorage so it persists across browser refreshes
      saveUserSession(user);

      setShowUsernameModal(false);
      setIsInitialized(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка подключения';
      setUsernameModalError(errorMessage);
    } finally {
      setUsernameModalLoading(false);
    }
  };

  // Load workouts for a specific month (defaults to current month if not specified)
  const loadWorkoutsForCurrentMonth = useCallback(async (month?: number, year?: number) => {
    try {
      if (!currentUser?.id) {
        return;
      }

      const today = new Date();
      const targetYear = year ?? today.getFullYear();
      const targetMonth = month ?? today.getMonth();

      // Load workouts for the specified month
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;

      const workouts = await getWorkoutsForDate(dateStr, currentUser.id);

      // Extract unique days that have workouts
      const newDaysWithWorkouts = new Set<string>();
      workouts.forEach((workout) => {
        const dateField = workout.date;

        if (!dateField) {
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
    } catch (error) {
      // Silently fail - use local data if available
    }
  }, [currentUser?.id]);

  // Handle month changes in calendar
  const handleCalendarMonthChange = async (month: number, year: number) => {
    await loadWorkoutsForCurrentMonth(month, year);
  };

  // Load workouts when user is authenticated
  useEffect(() => {
    if (isInitialized && currentUser?.id) {
      loadWorkoutsForCurrentMonth();
    }
  }, [isInitialized, currentUser?.id, loadWorkoutsForCurrentMonth]);

  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [calendarScrollPosition, setCalendarScrollPosition] = useState(0);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [exercisesWithTrackedSets, setExercisesWithTrackedSets] = useState<Map<string, Set[]>>(new Map());
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<Map<string, ExerciseWithTrackSets[]>>(new Map());
  const [isClosing, setIsClosing] = useState(false);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);

  const handleDayClick = async (day: number, month: number, year: number) => {
    // Сохраняем позицию скролла календаря перед переходом
    const calendarContainer = document.querySelector('.calendar-scroll-container');
    if (calendarContainer) {
      setCalendarScrollPosition(calendarContainer.scrollTop);
    }
    setSelectedDate({ day, month, year });

    const dateKey = `${day}-${month}-${year}`;
    let savedExercises: ExerciseWithTrackSets[] | null = null;
    let workoutId: string | null = null;

    // ALWAYS try to load from server first to ensure sync across browsers
    try {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const workoutSetsData = await getWorkoutSetsForDay(dateStr, currentUser?.id);

      if (workoutSetsData && workoutSetsData.exercises.size > 0) {
        workoutId = workoutSetsData.workoutId;
        // Преобразуем данные с сервера в формат нашего приложения
        const exercisesFromServer: ExerciseWithTrackSets[] = [];

        for (const [directusExerciseId, workoutExercise] of workoutSetsData.exercises) {
          const exerciseSets = workoutSetsData.exerciseSets.get(directusExerciseId) || [];

          // Преобразуем workout_sets в trackSets
          const trackSets: Set[] = exerciseSets.map(set => ({
            reps: set.reps,
            weight: set.weight
          }));

          // Получаем информацию об упражнении из кэша
          let exerciseInfo = allExercises.find(ex => String(ex.id) === directusExerciseId);

          if (!exerciseInfo) {
            // Если нет в кэше, пытаемся загрузить
            try {
              // Get exercise name from the exercise object in workoutExercise
              const exerciseName = (workoutExercise as any).exercise?.name || 'Unknown Exercise';
              exerciseInfo = {
                id: directusExerciseId,
                name: exerciseName,
                category: (workoutExercise as any).exercise?.category || 'Unknown',
                description: (workoutExercise as any).exercise?.description || ''
              };
            } catch (err) {
              // Создаем минимальный объект упражнения
              exerciseInfo = {
                id: directusExerciseId,
                name: 'Unknown Exercise',
                category: 'Unknown',
                description: ''
              };
            }
          }

          exercisesFromServer.push({
            ...exerciseInfo,
            trackSets
          });
        }

        savedExercises = exercisesFromServer;

        // Update profileStats with data loaded from server
        recordProfileWorkout(dateStr, exercisesFromServer, currentUser?.created_at);
      }
    } catch (error) {
      // Fall back to localStorage if server fails
      savedExercises = savedWorkouts.get(dateKey) || null;
    }

    if (savedExercises && savedExercises.length > 0) {
      // Если есть сохраненная тренировка - переходим на MyExercisesPage
      const newTrackedSets = new Map<string, Set[]>();
      savedExercises.forEach(ex => {
        // Ensure ID is string for consistent storage
        newTrackedSets.set(String(ex.id), ex.trackSets);
      });
      setCurrentWorkoutId(workoutId);
      setExercisesWithTrackedSets(newTrackedSets);
      setSelectedExercises(savedExercises.map(({ ...ex }) => ex as Exercise));
      setCurrentPage('tracking');
    } else {
      // Иначе переходим на ExercisesPage для выбора упражнений
      setCurrentWorkoutId(null);
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

    // Сохраняем в localStorage для восстановления после перезагрузки
    try {
      const savingData: Record<string, ExerciseWithTrackSets[]> = {};
      newSavedWorkouts.forEach((value, key) => {
        savingData[key] = value;
      });
      localStorage.setItem('savedWorkouts', JSON.stringify(savingData));
      logger.debug('Saved workouts to localStorage', { count: newSavedWorkouts.size });
    } catch (error) {
      logger.warn('Failed to save workouts to localStorage', error);
    }

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
        exercises.map(({ trackSets }) => ({ trackSets })),
        currentUser?.created_at
      );
    }

    // Don't navigate away - user stays on tracking page to continue adding exercises
  };

  const handleWorkoutDeleted = () => {
    // Удаляем дату из workoutDays когда тренировка полностью удалена
    if (selectedDate) {
      const dateKey = `${selectedDate.day}-${selectedDate.month}-${selectedDate.year}`;
      setWorkoutDays((prev) => prev.filter((day) => day !== dateKey));
      logger.info('Workout deleted, removing from workoutDays', { dateKey });

      // Удаляем из savedWorkouts
      const newSavedWorkouts = new Map(savedWorkouts);
      newSavedWorkouts.delete(dateKey);
      setSavedWorkouts(newSavedWorkouts);

      // Сохраняем в localStorage
      try {
        const savingData: Record<string, ExerciseWithTrackSets[]> = {};
        newSavedWorkouts.forEach((value, key) => {
          savingData[key] = value;
        });
        localStorage.setItem('savedWorkouts', JSON.stringify(savingData));
      } catch (error) {
        logger.warn('Failed to update localStorage after workout deletion', error);
      }
    }

    // Переходим на ExercisesPage
    setIsClosing(true);
    setTimeout(() => {
      setCurrentPage('exercises');
      setIsClosing(false);
    }, 300);
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
        {isInitialized && !isLoadingWorkouts ? (
          <>
            {/* Calendar - always in DOM, just hidden */}
            <div
              style={{ display: currentPage === 'calendar' ? 'flex' : 'none' }}
              className={`w-full h-full flex-1 sm:rounded-[24px] overflow-hidden ${currentPage === 'calendar' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
            >
              <CalendarPage
                onDayClick={handleDayClick}
                onMonthChange={handleCalendarMonthChange}
                workoutDays={workoutDays}
                savedWorkouts={savedWorkouts}
              />
            </div>

            {/* Exercises */}
            <div
              style={{ display: currentPage === 'exercises' ? 'flex' : 'none' }}
              className={`w-full h-full flex-1 sm:rounded-[24px] overflow-hidden ${currentPage === 'exercises' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
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
              className={`w-full h-full flex-1 sm:rounded-[24px] overflow-hidden ${currentPage === 'tracking' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
            >
              <MyExercisesPage
                selectedExercises={exercisesWithTrackedSetsMemo}
                selectedDate={selectedDate}
                onBack={handleBackFromMyExercises}
                onSelectMoreExercises={handleSelectMoreExercisesFromMyPage}
                onSave={handleSaveTraining}
                currentWorkoutId={currentWorkoutId}
                onWorkoutDeleted={handleWorkoutDeleted}
              />
            </div>

            {/* Sheet overlays */}
            <ExerciseDetailSheetRenderer />
            <ProfileSheetRenderer />
            <SettingsSheetRenderer />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 px-6">
              <p className="text-fg-3 text-sm">Загрузка приложения...</p>

              {/* Progress bar */}
              <div className="w-full max-w-xs h-2 bg-bg-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              <p className="text-fg-2 text-xs">{loadingProgress}%</p>
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
