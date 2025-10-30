import { useState, useEffect } from 'react';
import { HeaderWithBackButton, Button, TrackCard, type Set } from '../components';
import { type Exercise } from '../services/directusApi';
import { useExerciseDetailSheet } from '../contexts/SheetContext';

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

  const handleBackToCalendar = () => {
    // Auto-save when going back to calendar
    if (selectedDate) {
      onSave?.(exercisesWithSets, selectedDate);
    }
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
