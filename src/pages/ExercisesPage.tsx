import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { FilterPill, ExerciseCard, Button, HeaderWithBackButton, StickyTagsBar, ErrorPage } from '../components';
import { fetchExercises, fetchCategories, type Exercise } from '../services/directusApi';
import { useExerciseDetailSheet } from '../contexts/SheetContext';

const STICKY_TOP = 64; // высота фиксированной шапки

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
  const { openExerciseDetail } = useExerciseDetailSheet();
  const [selectedExercises, setSelectedExercises] = useState<string[]>(initialSelectedIds);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>(['Грудь']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const handleExerciseImageClick = (exerciseId: string) => {
    openExerciseDetail(exerciseId);
  };

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

  const scrollToSection = useCallback((categoryId: string) => {
    const root = contentRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(
      `[data-category-id="${CSS.escape(categoryId)}"]`
    );
    if (!el) return;

    root.scrollTo({
      top: el.offsetTop - STICKY_TOP,
      behavior: 'smooth',
    });
  }, []);

  // Observer for sentinel element to show sticky bar when cloud passes
  useEffect(() => {
    if (loading) return;
    const root = contentRef.current;
    if (!root) return;

    const sentinel = root.querySelector<HTMLElement>('#cloud-sentinel');
    if (!sentinel) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowStickyBar(!entry.isIntersecting);
        });
      },
      {
        root,
        threshold: 0,
      }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [loading]);

  // Spy по секциям - отслеживаем активную категорию
  useLayoutEffect(() => {
    if (loading) return;
    const root = contentRef.current;
    if (!root) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('[data-category-id]')
    );
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;

        const id = (visible[0].target as HTMLElement).dataset.categoryId;
        if (id) setActiveCategory(id);
      },
      {
        root,
        threshold: [0, 0.25, 0.5],
        rootMargin: `-${STICKY_TOP + 8}px 0px -60% 0px`,
      }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [loading, categories.length]);

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
            onCategoryClick={scrollToSection}
          />
        </div>
      )}

      {/* Content container - bg-bg-1 with rounded corners */}
      <div className="flex-1 w-full bg-bg-1 rounded-3xl flex flex-col overflow-hidden shadow-card relative">

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
                onClick={() => scrollToSection(category)}
              />
            ))}
          </div>

          {/* Sentinel for sticky bar trigger */}
          <div id="cloud-sentinel" style={{ height: '1px', visibility: 'hidden' }} />

          {loading ? (
            <div className="py-8 text-center">
              <p className="text-fg-2">Загрузка упражнений...</p>
            </div>
          ) : (
            <>
              {categories.map((category) => {
                const categoryExercises = exercises.filter(
                  (ex) => ex.category === category
                );

                return (
                  <div
                    key={category}
                    data-category-id={category}
                    className="px-3 mb-8"
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
                          onImageClick={handleExerciseImageClick}
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
            </>
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
