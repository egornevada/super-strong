import { useState, useEffect } from 'react';
import { HeaderWithBackButton, Button, TrackCard, type Set } from '../components';
import { type Exercise } from '../services/directusApi';
import { useExerciseDetailSheet } from '../contexts/SheetContext';
import { saveWorkout, convertExerciseToApiFormat } from '../services/workoutsApi';
import { logger } from '../lib/logger';
import { showTelegramAlert } from '../lib/telegram';

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
  const { openExerciseDetail } = useExerciseDetailSheet();
  const [exercisesWithSets, setExercisesWithSets] = useState<ExerciseWithTrackSets[]>(selectedExercises);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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

  const handleAddSet = (index: number, reps: number, weight: number) => {
    const updated = [...exercisesWithSets];
    updated[index].trackSets.push({ reps, weight });
    setExercisesWithSets(updated);
  };

  const handleSelectMoreExercises = () => {
    // Notify parent to update state before navigating
    // Pass exercises with trackSets to parent
    onSelectMoreExercises?.(exercisesWithSets);
  };

  const handleBackToCalendar = async () => {
    // Auto-save when going back to calendar
    if (selectedDate && exercisesWithSets.length > 0) {
      await handleSaveWorkout();
    }
    onBack?.();
  };

  const handleSaveWorkout = async () => {
    if (!selectedDate || exercisesWithSets.length === 0) return;

    try {
      setIsSaving(true);
      const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;

      // Convert exercises to API format
      const apiExercises = exercisesWithSets
        .filter(ex => ex.trackSets.length > 0)
        .map(ex => convertExerciseToApiFormat(ex.id, ex.trackSets));

      if (apiExercises.length === 0) {
        logger.warn('No exercises with sets to save');
        showTelegramAlert('Добавьте хотя бы один подход перед сохранением');
        return;
      }

      // Save to server
      const workoutId = await saveWorkout(dateStr, apiExercises);

      // Also call local callback for local state management
      onSave?.(exercisesWithSets, selectedDate);

      logger.info('Workout saved with server sync', { workoutId, exerciseCount: apiExercises.length });
      showTelegramAlert('Тренировка сохранена!');
    } catch (error) {
      logger.error('Failed to save workout', error);
      showTelegramAlert('Ошибка при сохранении тренировки. Попробуйте позже.');
    } finally {
      setIsSaving(false);
    }
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
    <div className="w-full h-full bg-bg-3 flex flex-col">
      {/* Content container - bg-bg-1 with rounded corners */}
      <div className="flex-1 bg-bg-1 rounded-3xl shadow-card flex flex-col overflow-hidden">
        {/* Header */}
        <HeaderWithBackButton
          backButtonLabel={`${selectedDate.day} ${monthNames[selectedDate.month]}`}
          onBack={handleBackToCalendar}
        />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto bg-bg-1">
          {exercisesWithSets.length > 0 ? (
            <div className="px-3 py-4">
              {/* Select more exercises button */}
              <Button
                priority="secondary"
                tone="default"
                size="md"
                className="w-full mb-6"
                onClick={handleSelectMoreExercises}
              >
                Выбрать больше упражнений
              </Button>

              {exercisesWithSets.map((exercise, index) => (
                <TrackCard
                  key={exercise.id}
                  id={exercise.id}
                  name={exercise.name}
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
                  onImageClick={handleExerciseImageClick}
                />
              ))}

              {/* Save button */}
              <Button
                priority="primary"
                tone="brand"
                size="md"
                className="w-full mt-6"
                onClick={handleSaveWorkout}
                disabled={isSaving || exercisesWithSets.every(ex => ex.trackSets.length === 0)}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить тренировку'}
              </Button>

              {/* Bottom padding */}
              <div className="h-6" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-bg-1">
              <div className="text-center">
                <p className="text-fg-1 text-lg font-semibold mb-2">Упражнений не выбрано</p>
                <p className="text-fg-2 text-sm">Выбранные упражнения появятся здесь</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
