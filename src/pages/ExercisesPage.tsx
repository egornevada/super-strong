import { useState, useEffect, useRef } from 'react';
import { FilterPill, ExerciseCard, Button, HeaderWithBackButton, StickyTagsBar } from '../components';
import { fetchExercises, fetchCategories, type Exercise } from '../services/strapiApi';

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
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const cloudRef = useRef<HTMLDivElement>(null);

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
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Ошибка при загрузке данных');
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

  // Отслеживаем скролл и обновляем активную категорию + видимость sticky bar
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || !cloudRef.current) return;

      const scrollTop = contentRef.current.scrollTop;

      // Скрываем sticky bar если облако видно (находится в верхней части контейнера)
      // Облако находится в начале контента, поэтому когда скролл минимален - оно видно
      setShowStickyBar(scrollTop > 120); // 120px - примерная высота облака + margin

      // Ищем категорию которая видна на экране с учетом offset скроллинга
      // Точка проверки: на высоте sticky bar (примерно 140px от верхней части скроллинга)
      const checkPoint = scrollTop + 140;
      let foundCategory: string | null = null;

      for (const category of categories) {
        const element = categoryRefs.current[category];
        if (element) {
          const elementTop = element.offsetTop;

          // Ищем категорию которая находится выше или на checkPoint
          // и отслеживаем последнюю такую категорию (т.е. самую видимую)
          if (elementTop <= checkPoint) {
            foundCategory = category;
          }
        }
      }

      setActiveCategory(foundCategory);
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [categories]);

  // РЕЖИМ ВЫБОРА упражнений с плавающей кнопкой
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
    <div className="w-full h-full bg-bg-3 flex flex-col">
      {/* Outer page background - bg-bg-3 */}

      {/* Content container - bg-bg-1 with rounded corners */}
      <div className="flex-1 bg-bg-1 rounded-3xl overflow-hidden flex flex-col">
        {/* Header with back button */}
        <HeaderWithBackButton
          backButtonLabel={`${selectedDate.day} ${monthNames[selectedDate.month]}`}
          onBack={onBack}
        />

        {/* Sticky tags bar - appears on scroll */}
        {showStickyBar && (
          <StickyTagsBar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryClick={scrollToCategory}
          />
        )}

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
        >
          {/* Category filter cloud - scrolls with content */}
          <div ref={cloudRef} className="flex flex-wrap gap-2 px-3 pt-2 pb-3 mb-8">
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
              {categories.map((category) => {
                const categoryExercises = exercises.filter(
                  (ex) => ex.category === category
                );

                return (
                  <div
                    key={category}
                    ref={(el) => {
                      if (el) categoryRefs.current[category] = el;
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

                    {/* Exercises grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
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
        <div className="mt-2 px-4 py-4 bg-bg-1 rounded-t-3xl">
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
