import { useState, useEffect, useRef } from 'react';
import { FilterPill, ExerciseCard, Button, HeaderWithBackButton, StickyTagsBar, ErrorPage } from '../components';
import { fetchExercises, fetchCategories, type Exercise } from '../services/directusApi';

interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

interface ExercisesPageProps {
  selectedDate: SelectedDate | null;
  onBack?: () => void;
  onStartTraining?: (exercises: Exercise[]) => void;
  initialSelectedIds?: string[];
}

export function ExercisesPage({ selectedDate, onBack, onStartTraining, initialSelectedIds = [] }: ExercisesPageProps) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>(initialSelectedIds);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>(['Грудь']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstCategoryTitleRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const exercisesData = await fetchExercises();
        setExercises(exercisesData);

        // Пытаемся загрузить категории
        try {
          const categoriesData = await fetchCategories();
          setCategories(categoriesData.length > 0 ? categoriesData : ['Грудь']);
        } catch (categoryErr) {
          console.warn('Failed to load categories, deriving from exercises:', categoryErr);
          // Извлекаем уникальные категории из упражнений
          const uniqueCategories = Array.from(
            new Set(exercisesData.map((ex) => ex.category))
          ).sort();
          setCategories(uniqueCategories.length > 0 ? uniqueCategories : ['Грудь']);
        }
      } catch (err) {
        console.error('Error loading exercises:', err);
        setError('Ошибка при загрузке упражнений');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Синхронизируем выбранные упражнения если изменилось initialSelectedIds
  useEffect(() => {
    setSelectedExercises(initialSelectedIds);
  }, [initialSelectedIds]);

  const handleSelectExercise = (id: string) => {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((ex) => ex !== id) : [...prev, id]
    );
  };

  const scrollToCategory = (category: string) => {
    const categoryElement = categoryRefs.current[category];
    if (categoryElement && contentRef.current) {
      const offsetTop = categoryElement.offsetTop;
      // Offset учитывает высоту header (72px) + sticky bar (48px) + небольшой padding
      contentRef.current.scrollTop = offsetTop - 140;
    }
  };

  // Слушаем скролл и показываем sticky bar когда первый заголовок уходит из видимости
  // Зависимость от loading гарантирует что listener подвешится ПОСЛЕ загрузки данных
  useEffect(() => {
    if (loading) {
      return; // Не подвешиваем listener пока загружаются данные
    }

    const handleScroll = () => {
      if (!contentRef.current || !firstCategoryTitleRef.current) {
        return;
      }

      // Позиция первого заголовка относительно контейнера
      const firstTitleTop = firstCategoryTitleRef.current.getBoundingClientRect().top;
      const containerTop = contentRef.current.getBoundingClientRect().top;

      // Если заголовок выше контейнера - показываем sticky bar
      const shouldShow = firstTitleTop < containerTop;
      setShowStickyBar(shouldShow);
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loading]);

  // Форматирование даты
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

  const dateLabel = selectedDate
    ? `${selectedDate.day} ${monthNames[selectedDate.month]}`
    : '';

  // Если нет выбранной даты, показываем сообщение
  if (!selectedDate) {
    return (
      <div className="w-full h-full bg-bg-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-fg-2 text-lg">Выберите дату в календаре</p>
        </div>
      </div>
    );
  }

  // Если ошибка загрузки, показываем ErrorPage
  if (error && !loading) {
    return (
      <ErrorPage
        title="Не удается загрузить упражнения"
        message="Проверьте подключение к интернету или попробуйте позже."
        onBack={onBack}
        showBackButton={!!onBack}
      />
    );
  }

  return (
    <div className="w-full h-full bg-bg-3 flex flex-col relative">
      {/* Sticky tags bar - appears when scrolling */}
      {showStickyBar && (
        <div className="w-full bg-bg-1 border-b border-stroke-1 z-50">
          <StickyTagsBar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryClick={scrollToCategory}
          />
        </div>
      )}

      {/* Content container - bg-bg-1 with rounded corners */}
      <div className="flex-1 bg-bg-1 rounded-3xl flex flex-col overflow-hidden shadow-card relative">

        {/* Header with back button */}
        <HeaderWithBackButton
          backButtonLabel={dateLabel}
          onBack={onBack}
        />

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
        >
          {/* Category filter cloud - scrolls with content */}
          <div className="flex flex-wrap gap-2 px-3 pt-2 pb-3 mb-8">
            {categories.map((category) => (
              <FilterPill
                key={category}
                label={category}
                isActive={false}
                onClick={() => scrollToCategory(category)}
              />
            ))}
          </div>
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-fg-2">Загрузка упражнений...</p>
            </div>
          ) : (
            <div className="px-3">
              {categories.map((category, index) => {
                const categoryExercises = exercises.filter(
                  (ex) => ex.category === category
                );
                const isFirstCategory = index === 0;

                return (
                  <div
                    key={category}
                    ref={(el) => {
                      if (el) {
                        categoryRefs.current[category] = el;
                        // Для первой категории также установим ref в firstCategoryTitleRef
                        if (isFirstCategory) {
                          console.log('Setting firstCategoryTitleRef for first category:', category);
                          firstCategoryTitleRef.current = el;
                        }
                      }
                    }}
                    className="mb-8"
                  >
                    {/* Category title */}
                    <h2
                      className="text-fg-1 mb-3"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '20px',
                        fontWeight: 500,
                        lineHeight: '24px'
                      }}
                    >
                      {category}
                    </h2>

                    {/* Exercises grid - 2 columns on mobile, 3 columns on larger screens */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      {categoryExercises.map((exercise) => (
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
                      ))}
                    </div>

                    {categoryExercises.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-fg-3">Упражнений не найдено</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Invisible spacer for button - 88px */}
          <div className="h-22" />
        </div>
      </div>

      {/* Action button - separate block that pushes content up */}
      {selectedExercises.length > 0 && (
        <div className="mt-2 px-4 py-4 bg-bg-1 rounded-3xl shadow-card">
          <Button
            priority="primary"
            tone="brand"
            size="md"
            className="w-full"
            onClick={() => {
              const selectedList = exercises.filter((ex: Exercise) =>
                selectedExercises.includes(ex.id)
              );
              onStartTraining?.(selectedList);
            }}
          >
            Мои упражнения ({selectedExercises.length})
          </Button>
        </div>
      )}
    </div>
  );
}
