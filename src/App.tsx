import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTelegram } from './hooks/useTelegram';
import { useUser } from './contexts/UserContext';
import { syncPendingRequests, isOnline } from './lib/api';
import { logger } from './lib/logger';
import { showTelegramAlert } from './lib/telegram';
import { getWorkoutsForDate, getWorkoutSetsForDay, deleteWorkout, getAllWorkoutsForUser, getWorkoutSessionsWithCount, getWorkoutSessionExercises, loadMonthWorkoutData, loadAllUserWorkoutData } from './services/workoutsApi';
import { fetchExercises } from './services/directusApi';
import { syncExercisesFromDirectus } from './services/exerciseSyncService';
import { ExercisesPage } from './pages/ExercisesPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyExercisesPage } from './pages/MyExercisesPage';
import { DayDetailPage } from './pages/DayDetailPage';
import { BugReportSheetProvider, useBugReportSheet } from './contexts/BugReportSheetContext';
import { type Exercise } from './services/directusApi';
import { type Set, UsernameModal, LoadingScreen, Snackbar } from './components';
import { ExerciseDetailSheetRenderer } from './components/SheetRenderer';
import { ProfileSheetRenderer } from './components/ProfileSheetRenderer';
import { SettingsSheetRenderer } from './components/SettingsSheetRenderer';
import { BugReportSheetRenderer } from './components/BugReportSheetRenderer';
import { recordProfileWorkout, recalculateStatsFromSavedWorkouts } from './lib/profileStats';
import {
  getOrCreateUserByUsername,
  saveUserSession,
  getUserSession
} from './services/authApi';
import {
  getUserDayByDate,
  createUserDay
} from './services/supabaseApi';

type PageType = 'calendar' | 'exercises' | 'tracking' | 'daydetail' | 'bugreport';

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
  const queryClient = useQueryClient();
  const { setOnBugReportSubmitted } = useBugReportSheet();
  const [currentPage, setCurrentPage] = useState<PageType>('calendar');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameModalError, setUsernameModalError] = useState('');
  const [usernameModalLoading, setUsernameModalLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentLoadingStep, setCurrentLoadingStep] = useState('Загружаем данные пользователя');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showBugReportSnackbar, setShowBugReportSnackbar] = useState(false);
  const initializationAttempt = useRef(0);

  // Reset initialization attempt when user changes
  useEffect(() => {
    initializationAttempt.current = 0;
  }, [currentUser?.id]);

  // Set up bug report submission callback
  useEffect(() => {
    setOnBugReportSubmitted(() => (onClose: () => void) => {
      // Показываем snackbar (шит уже закроется автоматически)
      setShowBugReportSnackbar(true);
    });
  }, [setOnBugReportSubmitted]);

  // Auto-hide bug report snackbar after duration
  useEffect(() => {
    if (showBugReportSnackbar) {
      const timer = setTimeout(() => {
        setShowBugReportSnackbar(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showBugReportSnackbar]);

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
        setCurrentLoadingStep('Загружаем данные пользователя');

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

        setLoadingProgress(25);
        setCurrentLoadingStep('Загружаем упражнения');

        // Load exercises cache
        const exercisesData = await fetchExercises();
        setAllExercises(exercisesData);
        setLoadingProgress(40);

        // Sync exercises from Directus to Supabase
        if (isOnline()) {
          try {
            setCurrentLoadingStep('Синхронизируем упражнения');
            await syncExercisesFromDirectus();
          } catch (error) {
            // Continue anyway - exercises are still available from Directus
          }
        }

        setLoadingProgress(50);
        setCurrentLoadingStep('Загружаем тренировки');

        if (!isOnline()) {
          setIsLoadingWorkouts(false);
          setLoadingProgress(0);
          return;
        }

        /**
         * 📖 OPTIMIZED: Load only CURRENT MONTH first, then prefetch adjacent
         * Source: https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
         * This dramatically improves first load time vs loading ALL workouts
         */
        const today = new Date();
        const currentDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

        try {
          // Load current month workouts ONLY
          const currentMonthWorkouts = await getWorkoutsForDate(currentDateStr, currentUser?.id);
          setLoadingProgress(60);

          const workoutDaysSet = new Set<string>();

          /**
           * 📖 OPTIMIZED: Load all sessions in PARALLEL, not sequentially!
           * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
           *
           * ❌ БЫЛО: for (const workout of workouts) { await ... } - ПОСЛЕДОВАТЕЛЬНО (медленно!)
           * ✅ СТАЛО: Promise.all(workouts.map(...)) - ПАРАЛЛЕЛЬНО (быстро!)
           */
          if (currentMonthWorkouts && currentMonthWorkouts.length > 0) {
            // Load all sessions in parallel
            const sessionsPromises = currentMonthWorkouts.map(async (workout) => {
              try {
                const sessions = await getWorkoutSessionsWithCount(workout.id);
                return {
                  userDayId: workout.id,
                  date: workout.date,
                  hasWorkout: sessions && sessions.length > 0
                };
              } catch (err) {
                logger.warn('Failed to get sessions for day', { userDayId: workout.id });
                return {
                  userDayId: workout.id,
                  date: workout.date,
                  hasWorkout: false
                };
              }
            });

            // Wait for all sessions to load in parallel
            const resultsArray = await Promise.all(sessionsPromises);

            // Add days with workouts to the set
            resultsArray.forEach(result => {
              if (result.hasWorkout) {
                const dateStr = result.date;
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const day = parseInt(parts[2], 10);
                  const month = parseInt(parts[1], 10) - 1;
                  const year = parseInt(parts[0], 10);
                  const dateKey = `${day}-${month}-${year}`;
                  workoutDaysSet.add(dateKey);
                }
              }
            });
          }

          setWorkoutDays(Array.from(workoutDaysSet));
          logger.info('Current month workouts loaded in PARALLEL', {
            count: workoutDaysSet.size,
            totalDays: currentMonthWorkouts?.length
          });

          // Load ALL workout data for profile statistics (one time, not per month)
          setCurrentLoadingStep('Загружаем статистику тренировок');
          const allWorkoutData = await loadAllUserWorkoutData(
            currentUser?.id || '',
            exercisesData
          );

          // Set savedWorkouts with all data
          setSavedWorkouts(allWorkoutData);

          // Recalculate profile stats from ALL loaded data
          // Convert dateKey format (day-month-year) to YYYY-MM-DD format expected by profileStats
          const serverWorkoutsForStats = new Map<string, Array<{ trackSets: Set[] }>>();
          allWorkoutData.forEach((exercises, dateKey) => {
            const parts = dateKey.split('-');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              const isoDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              serverWorkoutsForStats.set(isoDateKey, exercises.map(ex => ({
                trackSets: ex.trackSets || []
              })));
            }
          });
          recalculateStatsFromSavedWorkouts(serverWorkoutsForStats, currentUser?.created_at);

          setLoadingProgress(65);

        } catch (err) {
          logger.warn('Failed to load current month workouts', { err });
        }

        setLoadingProgress(70);

        // Sync pending requests with timeout (don't block if offline or slow)
        try {
          setCurrentLoadingStep('Синхронизируем данные');
          await Promise.race([
            syncPendingRequests(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Sync timeout')), 15000)
            )
          ]);
        } catch (syncError) {
          // Continue anyway - pending requests will sync later
        }

        setLoadingProgress(90);
        setCurrentLoadingStep('Инициализируем приложение');

        // Prefetch adjacent months in the background (after showing UI)
        // This happens AFTER app is rendered, so doesn't block initial load
        // 📖 Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQueryClient#queryclientprefetchquery
        setTimeout(() => {
          // Prefetch previous month
          const prevMonth = today.getMonth() - 1 < 0 ? 11 : today.getMonth() - 1;
          const prevYear = today.getMonth() - 1 < 0 ? today.getFullYear() - 1 : today.getFullYear();
          queryClient.prefetchQuery({
            queryKey: ['workouts-month', prevYear, prevMonth],
            queryFn: async () => {
              const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
              return getWorkoutsForDate(dateStr, currentUser?.id);
            },
            staleTime: 1000 * 60 * 5,
          });

          // Prefetch next month
          const nextMonth = today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1;
          const nextYear = today.getMonth() + 1 > 11 ? today.getFullYear() + 1 : today.getFullYear();
          queryClient.prefetchQuery({
            queryKey: ['workouts-month', nextYear, nextMonth],
            queryFn: async () => {
              const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;
              return getWorkoutsForDate(dateStr, currentUser?.id);
            },
            staleTime: 1000 * 60 * 5,
          });

          logger.info('Prefetch for adjacent months started', { prevYear, prevMonth, nextYear, nextMonth });
        }, 500);

        setLoadingProgress(100);
        setIsLoadingWorkouts(false);
      } catch (error) {
        logger.error('Initialization error', { error });
        setIsLoadingWorkouts(false);
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

      // Extract unique days that have workouts WITH sessions
      const newDaysWithWorkouts = new Set<string>();

      /**
       * 📖 OPTIMIZED: Load all sessions in PARALLEL!
       * ❌ БЫЛО: for (const workout) { await ... } - ПОСЛЕДОВАТЕЛЬНО
       * ✅ СТАЛО: Promise.all() - ПАРАЛЛЕЛЬНО
       */
      if (workouts && workouts.length > 0) {
        // Get all sessions in parallel
        const sessionPromises = workouts.map(async (workout) => {
          try {
            const sessions = await getWorkoutSessionsWithCount(workout.id);
            return {
              dateField: workout.date,
              hasWorkout: sessions && sessions.length > 0
            };
          } catch (sessionError) {
            logger.warn('[CALENDAR] Error checking sessions', { dateField: workout.date });
            return {
              dateField: workout.date,
              hasWorkout: false
            };
          }
        });

        const resultsArray = await Promise.all(sessionPromises);

        // Process results
        resultsArray.forEach(result => {
          if (!result.dateField || !result.hasWorkout) return;

          const parts = result.dateField.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[2], 10);
            const workoutMonth = parseInt(parts[1], 10) - 1;
            const workoutYear = parseInt(parts[0], 10);
            newDaysWithWorkouts.add(`${day}-${workoutMonth}-${workoutYear}`);
          }
        });

        logger.debug('[CALENDAR] Loaded month workouts in PARALLEL', {
          month: targetMonth,
          year: targetYear,
          daysWithWorkouts: newDaysWithWorkouts.size
        });
      }

      // Accumulate workouts - merge new ones with existing ones
      setWorkoutDays((prev) => {
        const merged = new Set(prev);
        newDaysWithWorkouts.forEach(day => merged.add(day));
        return Array.from(merged);
      });

      // Load workout data for this specific month (for calendar display only)
      // Note: Profile statistics are calculated once at startup with ALL data, not updated per month
      try {
        const monthWorkoutData = await loadMonthWorkoutData(
          targetYear,
          targetMonth,
          currentUser.id,
          allExercises
        );

        // Merge with existing saved workouts (for calendar stats per month)
        setSavedWorkouts((prev) => {
          const merged = new Map(prev);
          monthWorkoutData.forEach((exercises, dateKey) => {
            merged.set(dateKey, exercises);
          });
          return merged;
        });

        logger.info('Month workout data loaded for calendar', {
          month: targetMonth,
          year: targetYear,
          daysCount: monthWorkoutData.size
        });
      } catch (statsError) {
        logger.warn('Failed to load month workout data', { statsError });
      }
    } catch (error) {
      // Silently fail - use local data if available
    }
  }, [currentUser?.id, allExercises]);

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
  const [currentUserDayId, setCurrentUserDayId] = useState<string | null>(null);
  const [dayDetailRefreshKey, setDayDetailRefreshKey] = useState(0);
  const [currentWorkoutSessionId, setCurrentWorkoutSessionId] = useState<string | null>(null);
  const [currentWorkoutStartTime, setCurrentWorkoutStartTime] = useState<string | null>(null);

  const handleDayClick = async (day: number, month: number, year: number) => {
    // Сохраняем позицию скролла календаря перед переходом
    const calendarContainer = document.querySelector('.calendar-scroll-container');
    if (calendarContainer) {
      setCalendarScrollPosition(calendarContainer.scrollTop);
    }
    setSelectedDate({ day, month, year });

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Get or create user_day for this date
    try {
      let userDay = await getUserDayByDate(currentUser?.id || '', dateStr);

      if (!userDay) {
        userDay = await createUserDay(currentUser?.id || '', dateStr);
        logger.debug('User day created', { userDayId: userDay.id, date: dateStr });
      }

      setCurrentUserDayId(userDay.id);

      // Check if there are any workout sessions for this day (new session-based structure)
      const workoutSessions = await getWorkoutSessionsWithCount(userDay.id);

      if (workoutSessions.length > 0) {
        // If there are sessions, show DayDetailPage
        logger.debug('Workout sessions found, showing DayDetailPage', { count: workoutSessions.length });
        setDayDetailRefreshKey(prev => prev + 1);
        setCurrentPage('daydetail');
      } else {
        // Otherwise, show ExercisesPage for new workout
        logger.debug('No workout sessions, showing ExercisesPage');
        setSelectedExercises([]);
        setExercisesWithTrackedSets(new Map());
        setCurrentPage('exercises');
      }
    } catch (error) {
      logger.error('Error loading user day or workout sessions', { error });
      // Fall back to exercises page on error
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

  /**
   * Shared function to refresh all workouts and statistics after deletion
   * Loads all workouts from server, updates calendar and stats
   * Used by both MyExercisesPage and DayDetailPage
   */
  const refreshAllWorkoutsAndStats = useCallback(async () => {
    try {
      if (!currentUser?.id) return;

      const allWorkouts = await getAllWorkoutsForUser(currentUser.id);
      const serverWorkoutsMap = new Map<string, Array<{ trackSets: Set[] }>>();
      const serverExercisesMap = new Map<string, ExerciseWithTrackSets[]>();

      // Convert server workouts to the format expected by recalculateStatsFromSavedWorkouts
      for (const workout of allWorkouts) {
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
          // ВАЖНО: сначала проверяем есть ли сессии в этом дне!
          // После удаления последней сессии, user_day остается пустой
          const sessions = await getWorkoutSessionsWithCount(workout.id);
          if (!sessions || sessions.length === 0) {
            // Нет сессий в этом дне - пропускаем
            logger.debug('No sessions in user day, skipping', { userDayId: workout.id, dateKey });
            continue;
          }

          const setsData = await getWorkoutSetsForDay(dateStr, currentUser.id);
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

      // Update UI with server data
      setSavedWorkouts(serverExercisesMap);
      const actualWorkoutDays = Array.from(serverExercisesMap.keys());
      setWorkoutDays(actualWorkoutDays);

      // Recalculate statistics
      recalculateStatsFromSavedWorkouts(serverWorkoutsMap, currentUser.created_at);
      logger.info('All workouts and stats refreshed after deletion', {
        daysCount: actualWorkoutDays.length,
        workoutDaysArray: actualWorkoutDays,
        allWorkoutsCount: allWorkouts.length,
        serverExercisesMapSize: serverExercisesMap.size
      });
    } catch (error) {
      logger.error('Error refreshing workouts and stats', { error });
    }
  }, [currentUser?.id, allExercises]);

  const handleWorkoutDeleted = async () => {
    try {
      logger.info('Workout deleted callback triggered', { selectedDate });

      // Refresh all data from server
      await refreshAllWorkoutsAndStats();

      // Navigate to ExercisesPage
      setIsClosing(true);
      setTimeout(() => {
        setCurrentPage('exercises');
        setIsClosing(false);
      }, 300);
    } catch (error) {
      logger.error('Error handling workout deletion', { error });
      showTelegramAlert('Ошибка при удалении тренировки');
    }
  };

  const handleBackFromMyExercises = () => {
    logger.warn('[PAGE] handleBackFromMyExercises called');
    setIsClosing(true);
    setTimeout(() => {
      logger.warn('[PAGE] Setting currentPage to calendar');
      setCurrentPage('calendar');
      setIsClosing(false);
      setSelectedExercises([]);
      setExercisesWithTrackedSets(new Map());
      setCurrentWorkoutSessionId(null);
      setCurrentWorkoutStartTime(null);
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
                onWorkoutDeleted={handleWorkoutDeleted}
                userDayId={currentUserDayId}
                workoutSessionId={currentWorkoutSessionId}
                workoutStartTime={currentWorkoutStartTime}
              />
            </div>

            {/* Day Detail Page - shows workout sessions for a day */}
            <div
              style={{ display: currentPage === 'daydetail' ? 'flex' : 'none' }}
              className={`w-full h-full flex-1 sm:rounded-[24px] overflow-hidden ${currentPage === 'daydetail' ? (isClosing ? 'dissolve-out' : 'dissolve-in') : ''}`}
            >
              {currentUserDayId && selectedDate && (
                <DayDetailPage
                  key={dayDetailRefreshKey}
                  userDayId={currentUserDayId}
                  date={selectedDate}
                  onWorkoutDeleted={refreshAllWorkoutsAndStats}
                  onBack={() => {
                    setIsClosing(true);
                    setTimeout(() => {
                      setCurrentPage('calendar');
                      setIsClosing(false);
                      setCurrentUserDayId(null);

                      // Recalculate workoutDays from current data when returning to calendar
                      // This ensures calendar reflects reality if workouts were deleted
                      const currentWorkoutDays = Array.from(savedWorkouts.keys());
                      setWorkoutDays(currentWorkoutDays);

                      // Restore calendar scroll position
                      setTimeout(() => {
                        const calendarContainer = document.querySelector('.calendar-scroll-container');
                        if (calendarContainer) {
                          calendarContainer.scrollTop = calendarScrollPosition;
                        }
                      }, 0);
                    }, 300);
                  }}
                  onStartNewWorkout={() => {
                    setIsClosing(true);
                    setTimeout(() => {
                      setCurrentPage('exercises');
                      setIsClosing(false);
                      setSelectedExercises([]);
                      setExercisesWithTrackedSets(new Map());
                      setCurrentWorkoutSessionId(null);
                      setCurrentWorkoutStartTime(null);
                    }, 300);
                  }}
                  onOpenWorkout={async (workoutSessionId: string, startedAt: string) => {
                    try {
                      // Load exercises for this workout session
                      const sessionData = await getWorkoutSessionExercises(workoutSessionId);

                      if (sessionData) {
                        // Convert to ExerciseWithTrackSets format
                        // Normalize: use directus_id as the main id (for consistency with new workouts)
                        const exercisesToShow: ExerciseWithTrackSets[] = sessionData.exercises.map(wexercise => {
                          const sets = sessionData.exercisesSets.get(wexercise.id) || [];
                          const trackSets: Set[] = sets.map(set => ({
                            reps: set.reps,
                            weight: set.weight
                          }));

                          // Normalize: replace Supabase id with directus_id so that saveWorkout uses the correct ID
                          return {
                            ...wexercise.exercise,
                            id: wexercise.exercise.directus_id, // Use directus_id as the primary id
                            trackSets
                          };
                        });

                        // Prepare data and navigate
                        const newTrackedSets = new Map<string, Set[]>();
                        exercisesToShow.forEach(ex => {
                          newTrackedSets.set(String(ex.id), ex.trackSets);
                        });
                        setExercisesWithTrackedSets(newTrackedSets);
                        setSelectedExercises(exercisesToShow);
                        setCurrentWorkoutSessionId(workoutSessionId);
                        setCurrentWorkoutStartTime(startedAt);

                        setIsClosing(true);
                        setTimeout(() => {
                          setCurrentPage('tracking');
                          setIsClosing(false);
                        }, 300);
                      }
                    } catch (error) {
                      logger.error('Failed to load workout session exercises', { workoutSessionId, error });
                      showTelegramAlert('Ошибка загрузки тренировки');
                    }
                  }}
                />
              )}
            </div>

            {/* Sheet overlays */}
            <ExerciseDetailSheetRenderer />
            <ProfileSheetRenderer />
            <SettingsSheetRenderer />
            <BugReportSheetRenderer />
          </>
        ) : (
          <LoadingScreen
            progress={loadingProgress}
            currentStep={currentLoadingStep}
            totalWeight={0}
            totalDays={0}
          />
        )}
      </div>

      {/* Bug Report Success Snackbar */}
      <Snackbar
        message="Отчет отправлен успешно"
        isVisible={showBugReportSnackbar}
        duration={5000}
        variant="inverted"
      />

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
