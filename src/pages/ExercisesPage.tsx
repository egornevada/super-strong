import { useState, useEffect } from 'react';
import { FilterPill, ExerciseCard, Button, HeaderWithBackButton } from '../components';
import { fetchExercises, fetchCategories, type Exercise } from '../services/strapiApi';

interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

interface ExercisesPageProps {
  selectedDate: SelectedDate | null;
  onBack?: () => void;
}

export function ExercisesPage({ selectedDate, onBack }: ExercisesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Грудь');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>(['Грудь']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [exercisesData, categoriesData] = await Promise.all([
          fetchExercises(),
          fetchCategories(),
        ]);
        setExercises(exercisesData);
        setCategories(categoriesData.length > 0 ? categoriesData : ['Грудь']);
        setSelectedCategory(categoriesData[0] || 'Грудь');
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Если нет выбранной даты, показываем пустую страницу
  if (!selectedDate) {
    return (
      <div className="w-full h-full bg-bg-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-fg-2 text-lg">Выберите дату в календаре</p>
        </div>
      </div>
    );
  }

  // Обработка ошибки загрузки
  if (error && !loading) {
    return (
      <div className="w-full h-full bg-bg-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-fg-2 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const hasExercises = selectedExercises.length > 0;

  const filteredExercises = exercises.filter(
    (ex) => ex.category === selectedCategory
  );

  const handleSelectExercise = (id: string) => {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((ex) => ex !== id) : [...prev, id]
    );
  };

  // РЕЖИМ ПРОСМОТРА упражнений (если есть выбранные упражнения)
  if (hasExercises) {
    const selectedExercisesList = exercises.filter((ex: Exercise) =>
      selectedExercises.includes(ex.id)
    );

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

    return (
      <div className="w-full h-full bg-bg-1 flex flex-col">
        {/* Header with back button */}
        <HeaderWithBackButton
          backButtonLabel={`${selectedDate.day} ${monthNames[selectedDate.month]}`}
          onBack={onBack}
        />

        {/* Exercises list */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-4">
            {selectedExercisesList.map((exercise: Exercise) => (
              <div
                key={exercise.id}
                className="p-4 bg-bg-2 rounded-lg border border-stroke-1"
              >
                <h3 className="font-medium text-fg-1">{exercise.name}</h3>
                <p className="text-sm text-fg-2 mt-1">{exercise.category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 py-4 border-t border-stroke-1 space-y-2">
          <Button
            priority="primary"
            tone="default"
            size="md"
            className="w-full"
            onClick={() => alert('Тренировка завершена!')}
          >
            Завершить тренировку
          </Button>
          <Button
            priority="secondary"
            tone="default"
            size="md"
            className="w-full"
            onClick={onBack}
          >
            Вернуться к календарю
          </Button>
        </div>
      </div>
    );
  }

  // РЕЖИМ ВЫБОРА упражнений (если упражнений не выбрано)
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

  return (
    <div className="min-h-screen bg-bg-1 pb-8">
      {/* Header with back button */}
      <HeaderWithBackButton
        backButtonLabel={`${selectedDate.day} ${monthNames[selectedDate.month]}`}
        onBack={onBack}
      />

      {/* Category filters */}
      <div className="sticky top-[72px] bg-bg-1 z-10 px-4 pt-4 pb-4 border-b border-stroke-1">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <FilterPill
              key={category}
              label={category}
              isActive={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6">
        {/* Category title */}
        <h2 className="text-2xl font-bold text-fg-1 mb-6">{selectedCategory}</h2>

        {/* Exercises grid */}
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-8 text-center">
              <p className="text-fg-2">Загрузка упражнений...</p>
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                id={exercise.id}
                name={exercise.name}
                image={
                  exercise.image ? (
                    <img
                      src={exercise.image.url}
                      alt={exercise.image.alternativeText || exercise.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : undefined
                }
                onSelect={handleSelectExercise}
                isSelected={selectedExercises.includes(exercise.id)}
              />
            ))
          )}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <p className="text-fg-3">Упражнений не найдено</p>
          </div>
        )}

        {/* Start workout button */}
        {selectedExercises.length > 0 && (
          <div className="mt-8 pb-4">
            <Button
              priority="primary"
              tone="default"
              size="md"
              className="w-full"
              onClick={() => {
                // Переключаемся на режим просмотра
                alert(
                  `Выбрано упражнений: ${selectedExercises.length}`
                );
              }}
            >
              Начать тренировку ({selectedExercises.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
