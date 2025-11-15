import React, { useState, useEffect } from 'react';
import { HeaderWithBackButton, Button, TrackCard, type Set } from '../components';
import { type Exercise } from '../services/directusApi';
import { useExerciseDetailSheet } from '../contexts/SheetContext';
import { useBugReportSheet } from '../contexts/BugReportSheetContext';
import { useUser } from '../contexts/UserContext';
import { convertExerciseToApiFormat, createAndSaveWorkoutSession, updateWorkoutSessionExercises, deleteWorkoutSessionWithExercises } from '../services/workoutsApi';
import { logger } from '../lib/logger';
import { showTelegramAlert } from '../lib/telegram';
import ArrowCircleLeftRounded from '@mui/icons-material/ArrowCircleLeftRounded';

interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

interface MyExercisesPageProps {
  selectedExercises: ExerciseWithTrackSets[];
  selectedDate: SelectedDate | null;
  onBack?: () => void;
  onSelectMoreExercises?: (exercises: ExerciseWithTrackSets[]) => void;
  onSave?: (exercises: ExerciseWithTrackSets[], date: SelectedDate) => void;
  onWorkoutDeleted?: () => void;
  userDayId?: string | null;
  workoutSessionId?: string | null;
  workoutStartTime?: string | null;
}

interface ExerciseWithTrackSets extends Exercise {
  trackSets: Set[];
}

export function MyExercisesPage({
  selectedExercises,
  selectedDate,
  onBack,
  onSelectMoreExercises,
  onSave,
  onWorkoutDeleted,
  userDayId,
  workoutSessionId,
  workoutStartTime
}: MyExercisesPageProps) {
  const { currentUser } = useUser();
  const { openBugReportSheet } = useBugReportSheet();

  logger.info('[TRACKING] MyExercisesPage mounted/updated', {
    selectedExercisesCount: selectedExercises?.length,
    selectedDate,
    userDayId,
    hasCurrentUser: !!currentUser?.id
  });

  const { openExerciseDetail } = useExerciseDetailSheet();
  const [exercisesWithSets, setExercisesWithSets] = useState<ExerciseWithTrackSets[]>(selectedExercises);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingWithDelay, setIsLoadingWithDelay] = useState(false);
  const savingRef = React.useRef(false);

  // Handle loader delay: show loader for 1 second after saving completes
  useEffect(() => {
    if (isSaving) {
      setIsLoadingWithDelay(true);
    } else if (isLoadingWithDelay) {
      // Wait 1 second before hiding loader
      const timer = setTimeout(() => {
        setIsLoadingWithDelay(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, isLoadingWithDelay]);

  useEffect(() => {
    logger.info('[TRACKING] useEffect: selectedExercises changed', { count: selectedExercises?.length });
    setExercisesWithSets(selectedExercises);
  }, [selectedExercises]);

  const handleDeleteExercise = async (exerciseId: string) => {
    // Remove the exercise from the current workout
    const updated = exercisesWithSets.filter(ex => ex.id !== exerciseId);
    setExercisesWithSets(updated);

    logger.info('Exercise deleted from workout', { exerciseId, remainingCount: updated.length });

    // If no exercises left, delete the entire workout session
    if (updated.length === 0) {
      try {
        logger.info('No exercises remaining, deleting workout session', {
          workoutSessionId,
          userDayId
        });

        // If editing existing session - delete the session
        if (workoutSessionId) {
          await deleteWorkoutSessionWithExercises(workoutSessionId);
          logger.info('Workout session deleted successfully', { workoutSessionId });
          onWorkoutDeleted?.();
        }
        // If creating new workout and user removes all exercises - just go back
        // (we haven't saved yet, so nothing to delete)
        else {
          logger.debug('New workout with no exercises - just going back');
        }

        // Navigate back to exercise selection
        onSelectMoreExercises?.(updated);
      } catch (error) {
        logger.error('Failed to delete workout session', error);
        showTelegramAlert('Ошибка удаления тренировки');
      }
    }
    // Note: Don't save here - will save when user goes back to calendar
  };

  const handleExerciseImageClick = (exerciseId: string) => {
    // Pass delete callback when opening exercise detail
    const deleteCallback = () => handleDeleteExercise(exerciseId);
    openExerciseDetail(exerciseId, deleteCallback);
  };

  const monthNames = [
    'Янв.',
    'Фев.',
    'Мар.',
    'Апр.',
    'Май',
    'Июн.',
    'Июл.',
    'Авг.',
    'Сен.',
    'Окт.',
    'Ноя.',
    'Дек.',
  ];

  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  };

  const pageTitle = workoutStartTime
    ? `Тренировка ${formatTime(workoutStartTime)}`
    : 'Ваши упражнения';

  const handleAddSet = (exerciseIndex: number, reps: number, weight: number) => {
    logger.debug('handleAddSet called', { exerciseIndex, reps, weight });
    const updated = [...exercisesWithSets];
    const target = updated[exerciseIndex];
    if (!target) return;

    const trackSets = [...target.trackSets, { reps, weight }];
    updated[exerciseIndex] = { ...target, trackSets };
    setExercisesWithSets(updated);
  };

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, reps: number, weight: number) => {
    const updated = [...exercisesWithSets];
    const target = updated[exerciseIndex];
    if (!target) return;

    const trackSets = [...target.trackSets];
    if (!trackSets[setIndex]) {
      return;
    }

    trackSets[setIndex] = { reps, weight };
    updated[exerciseIndex] = { ...target, trackSets };
    setExercisesWithSets(updated);
  };

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercisesWithSets];
    const target = updated[exerciseIndex];
    if (!target) return;

    const trackSets = [...target.trackSets];
    if (!trackSets[setIndex]) {
      return;
    }

    trackSets.splice(setIndex, 1);
    updated[exerciseIndex] = { ...target, trackSets };
    logger.debug('Set deleted', { exerciseName: target.name, setIndex: setIndex + 1, remainingSets: trackSets.length });

    setExercisesWithSets(updated);
  };

  const handleSelectMoreExercises = () => {
    logger.warn('[TRACKING] handleSelectMoreExercises called');
    // Notify parent to update state before navigating
    // Pass exercises with trackSets to parent
    logger.warn('[TRACKING] Calling onSelectMoreExercises callback');
    onSelectMoreExercises?.(exercisesWithSets);
  };

  const handleAutoSaveWorkout = async (exercises: ExerciseWithTrackSets[] = exercisesWithSets) => {
    // Prevent concurrent saves
    if (savingRef.current) {
      logger.debug('Skipping save - already saving');
      return;
    }

    try {
      savingRef.current = true;
      setIsSaving(true);

      // Convert exercises to API format
      const apiExercises = exercises.map(ex => convertExerciseToApiFormat(String(ex.id), ex.trackSets));

      // If this is an existing workout session, update it
      if (workoutSessionId) {
        logger.info('Updating existing workout session', {
          workoutSessionId,
          exerciseCount: apiExercises.length,
          setCount: apiExercises.reduce((sum, ex) => sum + ex.sets.length, 0)
        });

        await updateWorkoutSessionExercises(workoutSessionId, apiExercises);

        logger.info('Workout session updated successfully', { workoutSessionId, exerciseCount: apiExercises.length });
        return;
      }

      // For NEW workouts, validate required inputs
      if (!selectedDate || !userDayId || !currentUser?.id || exercises.length === 0) {
        logger.debug('Skipping save - missing required data for new workout', {
          hasDate: !!selectedDate,
          hasUserDayId: !!userDayId,
          hasUserId: !!currentUser?.id,
          exerciseCount: exercises.length
        });
        return;
      }

      logger.info('Saving NEW workout session', {
        userDayId,
        exerciseCount: apiExercises.length,
        setCount: apiExercises.reduce((sum, ex) => sum + ex.sets.length, 0)
      });

      // Save to server - this creates a NEW session and saves all exercises
      const sessionId = await createAndSaveWorkoutSession(currentUser.id, userDayId, apiExercises);

      logger.info('Workout session saved successfully', { sessionId, exerciseCount: apiExercises.length });

      // Notify parent to update calendar
      onSave?.(exercises, selectedDate);

    } catch (error) {
      logger.error('Failed to save workout session', { error });
      showTelegramAlert('Ошибка сохранения тренировки');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleBackToCalendar = async () => {
    logger.warn('[TRACKING] handleBackToCalendar called');

    // Save workout before going back (even if no sets added yet)
    logger.warn('[TRACKING] Saving workout before going back');
    await handleAutoSaveWorkout();

    // Make sure any pending saves complete
    if (savingRef.current) {
      logger.warn('[TRACKING] Waiting for save to complete before going back...');
      logger.info('Waiting for save to complete before going back...');
      // Wait for saving to finish
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!savingRef.current) {
            logger.warn('[TRACKING] Save finished, calling onBack now');
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
      });
    }
    logger.warn('[TRACKING] Calling onBack');
    onBack?.();
  };

  if (!selectedDate) {
    return (
      <div className="w-full h-full bg-bg-3 flex items-center justify-center">
        <div className="text-center">
          <p className="text-fg-2 text-lg">Нет выбранной даты</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-bg-1">
      {/* Header */}
      <div className="bg-bg-1">
        <HeaderWithBackButton
          backButtonLabel={`${selectedDate.day} ${monthNames[selectedDate.month]}`}
          onBack={handleBackToCalendar}
          isLoading={isLoadingWithDelay}
          onOpenBugReport={() => openBugReportSheet('Мои упражнения')}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
          {exercisesWithSets.length > 0 ? (
            <div className="px-3 py-4">
              <h2 className="text-fg-1 text-heading-md mb-4">
                {pageTitle}
              </h2>
              {exercisesWithSets.map((exercise, index) => (
                <TrackCard
                  key={exercise.id}
                  id={exercise.id}
                  name={exercise.name}
                  subtitle={
                    exercise.description?.trim() ||
                    (exercise.category ? `Упражнение на ${exercise.category.toLowerCase()}` : undefined)
                  }
                  image={
                    exercise.image ? (
                      <div className="w-full h-full overflow-hidden">
                        <img
                          src={exercise.image.url}
                          alt={exercise.image.alternativeText || exercise.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : undefined
                  }
                  sets={exercise.trackSets}
                  onAddSet={(reps, weight) => handleAddSet(index, reps, weight)}
                  onUpdateSet={(setIndex, reps, weight) => handleUpdateSet(index, setIndex, reps, weight)}
                  onDeleteSet={(setIndex) => handleDeleteSet(index, setIndex)}
                  onImageClick={handleExerciseImageClick}
                  onTitleClick={handleExerciseImageClick}
                />
              ))}

              {/* Bottom padding */}
              <div className="h-6" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-fg-1 text-lg font-semibold mb-2">Упражнений не выбрано</p>
                <p className="text-fg-2 text-sm">Выбранные упражнения появятся здесь</p>
              </div>
            </div>
          )}
      </div>

      {/* Select more exercises button - fixed at bottom */}
      {exercisesWithSets.length > 0 && (
        <div className="bg-bg-1">
          <Button
            priority="secondary"
            tone="default"
            size="md"
            className="w-full rounded-none pt-4 pb-6"
            style={{ borderRadius: '0', height: '64px' }}
            leftIcon={<ArrowCircleLeftRounded />}
            onClick={handleSelectMoreExercises}
          >
            Выбрать больше упражнений
          </Button>
        </div>
      )}
    </div>
  );
}
