import React, { useState, useEffect } from 'react';
import { HeaderWithBackButton, Button, TrackCard, type Set } from '../components';
import { type Exercise } from '../services/directusApi';
import { useExerciseDetailSheet } from '../contexts/SheetContext';
import { saveWorkout, convertExerciseToApiFormat } from '../services/workoutsApi';
import { logger } from '../lib/logger';
import { showTelegramAlert } from '../lib/telegram';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';

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
}

interface ExerciseWithTrackSets extends Exercise {
  trackSets: Set[];
}

export function MyExercisesPage({
  selectedExercises,
  selectedDate,
  onBack,
  onSelectMoreExercises,
  onSave
}: MyExercisesPageProps) {
  logger.info('[TRACKING] MyExercisesPage mounted/updated', {
    selectedExercisesCount: selectedExercises?.length,
    selectedDate,
    hasOnBack: !!onBack,
    hasOnSelectMoreExercises: !!onSelectMoreExercises,
    hasOnSave: !!onSave
  });
  const { openExerciseDetail } = useExerciseDetailSheet();
  const [exercisesWithSets, setExercisesWithSets] = useState<ExerciseWithTrackSets[]>(selectedExercises);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = React.useRef(false);

  useEffect(() => {
    logger.info('[TRACKING] useEffect: selectedExercises changed', { count: selectedExercises?.length });
    setExercisesWithSets(selectedExercises);
  }, [selectedExercises]);

  const handleExerciseImageClick = (exerciseId: string) => {
    openExerciseDetail(exerciseId);
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

  const handleAddSet = async (exerciseIndex: number, reps: number, weight: number) => {
    logger.warn('[TRACKING] handleAddSet called', { exerciseIndex, reps, weight });
    const updated = [...exercisesWithSets];
    const target = updated[exerciseIndex];
    if (!target) return;

    const trackSets = [...target.trackSets, { reps, weight }];
    updated[exerciseIndex] = { ...target, trackSets };
    logger.debug('Set added', { exerciseName: target.name, reps, weight });

    setExercisesWithSets(updated);

    // Save immediately
    logger.warn('[TRACKING] About to save workout');
    await handleAutoSaveWorkout(updated);
    logger.warn('[TRACKING] Workout save completed');
  };

  const handleUpdateSet = async (exerciseIndex: number, setIndex: number, reps: number, weight: number) => {
    const updated = [...exercisesWithSets];
    const target = updated[exerciseIndex];
    if (!target) return;

    const trackSets = [...target.trackSets];
    if (!trackSets[setIndex]) {
      return;
    }

    trackSets[setIndex] = { reps, weight };
    updated[exerciseIndex] = { ...target, trackSets };
    logger.debug('Set updated', { exerciseName: target.name, setIndex: setIndex + 1, reps, weight });

    setExercisesWithSets(updated);

    // Save immediately
    await handleAutoSaveWorkout(updated);
  };

  const handleSelectMoreExercises = () => {
    logger.warn('[TRACKING] handleSelectMoreExercises called');
    // Notify parent to update state before navigating
    // Pass exercises with trackSets to parent
    logger.warn('[TRACKING] Calling onSelectMoreExercises callback');
    onSelectMoreExercises?.(exercisesWithSets);
  };

  const handleAutoSaveWorkout = async (exercises: ExerciseWithTrackSets[] = exercisesWithSets) => {
    logger.warn('[TRACKING] handleAutoSaveWorkout called');
    if (!selectedDate || exercises.length === 0) {
      logger.warn('[TRACKING] Skipping save - no date or exercises');
      return;
    }

    // Prevent concurrent saves
    if (savingRef.current) {
      logger.warn('[TRACKING] Skipping save - already saving');
      return;
    }

    try {
      savingRef.current = true;
      setIsSaving(true);
      const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;

      // Convert exercises to API format
      const apiExercises = exercises
        .filter(ex => ex.trackSets.length > 0)
        .map(ex => convertExerciseToApiFormat(ex.id, ex.trackSets));

      if (apiExercises.length === 0) {
        logger.warn('[TRACKING] No exercises with sets to save');
        logger.debug('No exercises with sets to save (auto-save skipped)');
        return;
      }

      logger.warn('[TRACKING] Saving workout to server...', { dateStr, exerciseCount: apiExercises.length });
      logger.info('Saving workout...', { dateStr, exerciseCount: apiExercises.length });

      // Save to server
      const workoutId = await saveWorkout(dateStr, apiExercises);

      // Update parent state to reflect new workout (adds dot to calendar)
      // This does NOT navigate away - it only updates the workoutDays state
      logger.warn('[TRACKING] Calling onSave callback', { workoutId });
      onSave?.(exercises, selectedDate);

      logger.warn('[TRACKING] Workout saved successfully', { workoutId });
      logger.info('Workout saved successfully', { workoutId, exerciseCount: apiExercises.length });
    } catch (error) {
      logger.warn('[TRACKING] Error saving workout', error);
      logger.error('Failed to save workout', error);
      showTelegramAlert('Ошибка сохранения тренировки');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
      logger.warn('[TRACKING] Save attempt finished');
    }
  };

  const handleBackToCalendar = async () => {
    logger.warn('[TRACKING] handleBackToCalendar called');
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
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
          {exercisesWithSets.length > 0 ? (
            <div className="px-3 py-4">
              <h2
                className="text-fg-1 font-semibold mb-4"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '24px',
                  letterSpacing: '-3%',
                  margin: 0,
                  marginBottom: '16px'
                }}
              >
                Ваши упражнения
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
                      <img
                        src={exercise.image.url}
                        alt={exercise.image.alternativeText || exercise.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : undefined
                  }
                  sets={exercise.trackSets}
                  onAddSet={(reps, weight) => handleAddSet(index, reps, weight)}
                  onUpdateSet={(setIndex, reps, weight) => handleUpdateSet(index, setIndex, reps, weight)}
                  onImageClick={handleExerciseImageClick}
                />
              ))}

              {/* Auto-save indicator */}
              {isSaving && (
                <div className="mt-4 text-center">
                  <p className="text-fg-2 text-sm">Сохраняется...</p>
                </div>
              )}

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
            leftIcon={<ArrowCircleLeftIcon />}
            onClick={handleSelectMoreExercises}
          >
            Выбрать больше упражнений
          </Button>
        </div>
      )}
    </div>
  );
}
