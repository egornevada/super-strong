import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { FilterPill, ExerciseCard, Button, HeaderWithBackButton, StickyTagsBar, ErrorPage } from '../components';
import { fetchBatchInitData, fetchExercises, fetchCategories, type Exercise } from '../services/directusApi';
import { useExerciseDetailSheet } from '../contexts/SheetContext';
import { useBugReportSheet } from '../contexts/BugReportSheetContext';
import ArrowCircleRightRounded from '@mui/icons-material/ArrowCircleRightRounded';

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
  const { openBugReportSheet } = useBugReportSheet();
  const [selectedExercises, setSelectedExercises] = useState<string[]>(initialSelectedIds);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>(['Грудь']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammaticallyRef = useRef(false);


  const handleExerciseImageClick = (exerciseId: string) => {
    const isExerciseAdded = selectedExercises.includes(exerciseId);

    const onAddExercise = () => {
      setSelectedExercises([...selectedExercises, exerciseId]);
    };

    const onRemoveExercise = () => {
      setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
    };

    openExerciseDetail(
      exerciseId,
      undefined,  // no onDeleteExercise
      onAddExercise,  // always pass both callbacks
      onRemoveExercise,  // so user can toggle between add/remove
      isExerciseAdded  // pass the current state
    );
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Используем batch endpoint для загрузки ВСЕГО в одном запросе
        try {
          const { exercises: exercisesData, categories: categoriesData } = await fetchBatchInitData();
          setExercises(exercisesData);
          // Backend возвращает категории как массив объектов {id, name}, извлекаем только имена
          const categoryNames = Array.isArray(categoriesData) && categoriesData.length > 0
            ? categoriesData.map((cat: any) => typeof cat === 'string' ? cat : cat.name)
            : ['Грудь'];
          setCategories(categoryNames);
        } catch (batchErr) {
          // Fallback: если batch endpoint не работает, загружаем отдельно
          console.warn('Batch endpoint failed, falling back to separate requests:', batchErr);
          const [exercisesData, categoriesDataResult] = await Promise.all([
            fetchExercises(),
            fetchCategories().catch(() => null)
          ]);

          setExercises(exercisesData);
          if (categoriesDataResult && categoriesDataResult.length > 0) {
            setCategories(categoriesDataResult);
          } else {
            const uniqueCategories = Array.from(
              new Set(exercisesData.map((ex) => ex.category))
            ).sort();
            setCategories(uniqueCategories.length > 0 ? uniqueCategories : ['Грудь']);
          }
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

    // Disable spy scroll and UI updates BEFORE scroll starts
    isScrollingProgrammaticallyRef.current = true;

    const targetScrollTop = el.offsetTop - STICKY_TOP;
    let lastScrollTop = root.scrollTop;
    let scrollCheckCount = 0;

    const checkScrollComplete = () => {
      const currentScrollTop = root.scrollTop;

      // If scroll position hasn't changed, scroll is complete
      if (currentScrollTop === lastScrollTop) {
        scrollCheckCount++;
        if (scrollCheckCount >= 2) {
          // Scroll finished, update UI
          setActiveCategory(categoryId);
          isScrollingProgrammaticallyRef.current = false;
          return;
        }
      } else {
        scrollCheckCount = 0;
      }

      lastScrollTop = currentScrollTop;
      requestAnimationFrame(checkScrollComplete);
    };

    root.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });

    // Check when scroll completes instead of using fixed timeout
    requestAnimationFrame(checkScrollComplete);
  }, []);

  // Show sticky bar when filter pills scroll out of view
  useEffect(() => {
    if (loading || categories.length === 0) return;
    const root = contentRef.current;
    if (!root) return;

    // Use RAF to ensure DOM is fully rendered
    let frameId: number;
    let scrollListener: (() => void) | null = null;

    const setupListener = () => {
      const filterPills = root.querySelector<HTMLElement>('.flex.flex-wrap.gap-2');
      if (!filterPills) {
        // Retry if element not found
        frameId = requestAnimationFrame(setupListener);
        return;
      }

      const handleScroll = () => {
        // Skip if programmatically scrolling
        if (isScrollingProgrammaticallyRef.current) return;

        // Get the bottom position of filter pills
        const filterRect = filterPills.getBoundingClientRect();
        const filterBottom = filterRect.bottom;

        // Show sticky bar when filter pills scroll past the top (they're no longer visible)
        setShowStickyBar(filterBottom < 0);
      };

      scrollListener = handleScroll;
      root.addEventListener('scroll', handleScroll, { passive: true });
      // Initial call to set correct state
      handleScroll();
    };

    frameId = requestAnimationFrame(setupListener);

    return () => {
      cancelAnimationFrame(frameId);
      if (scrollListener) {
        root.removeEventListener('scroll', scrollListener);
      }
    };
  }, [loading, categories.length]);

  // Spy по секциям - отслеживаем активную категорию
  useLayoutEffect(() => {
    if (loading) return;
    const root = contentRef.current;
    if (!root) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('[data-category-id]')
    );
    if (!sections.length) return;

    const handleScroll = () => {
      // Skip spy scroll during programmatic scrolling
      if (isScrollingProgrammaticallyRef.current) return;

      const targetPosition = STICKY_TOP;
      let activeSection: HTMLElement | null = null;

      // Find first section that is visible at the top
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const rect = section.getBoundingClientRect();

        // If section top is above target, or section contains target position
        if (rect.top <= targetPosition && rect.bottom > targetPosition) {
          activeSection = section;
          break;
        }
      }

      // If no section found, use the first one visible
      if (!activeSection) {
        for (let i = 0; i < sections.length; i++) {
          const rect = sections[i].getBoundingClientRect();
          if (rect.top < window.innerHeight) {
            activeSection = sections[i];
            break;
          }
        }
      }

      // If still no section, use the first one
      if (!activeSection && sections.length > 0) {
        activeSection = sections[0];
      }

      if (activeSection) {
        const id = activeSection.dataset.categoryId;
        if (id) setActiveCategory(id);
      }
    };

    root.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call
    handleScroll();

    return () => {
      root.removeEventListener('scroll', handleScroll);
    };
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
    <div className="w-full h-full bg-bg-1 flex flex-col relative">
      {/* Header with back button */}
      <div className="bg-bg-1">
        <HeaderWithBackButton
          backButtonLabel={dateLabel}
          onBack={onBack}
          onOpenBugReport={() => openBugReportSheet('Упражнения')}
        />
      </div>

      {/* Fixed sticky tags bar - appears when scrolling */}
      {showStickyBar && (
        <div
          className="w-full bg-bg-1 border-b border-stroke-1 z-50 fixed left-0 right-0"
          style={{
            top: '64px',
          }}
        >
          <StickyTagsBar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryClick={scrollToSection}
          />
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
      >
          {/* Category filter cloud - scrolls with content */}
          <div className="flex flex-wrap gap-2 px-3 pt-2 pb-3">
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
                    className="px-3 pt-[52px]"
                  >
                    {/* Category title */}
                    <h2 className="text-fg-1 text-heading-md mb-3">
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
                              <div className="w-full h-full overflow-hidden">
                                <img
                                  src={exercise.image.url}
                                  alt={exercise.image.alternativeText || exercise.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
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

        {/* Action button - separate block that pushes content up */}
        {selectedExercises.length > 0 && (
        <div className="bg-bg-1">
          <Button
            priority="primary"
            tone="brand"
            size="md"
            className="w-full rounded-none pt-4 pb-6"
            style={{ borderRadius: '0', height: '64px' }}
            rightIcon={<ArrowCircleRightRounded />}
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
