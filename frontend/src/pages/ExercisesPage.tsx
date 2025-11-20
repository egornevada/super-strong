import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { FilterPill, ExerciseCard, Button, HeaderWithBackButton, StickyTagsBar, ErrorPage } from '../components';
import { ExercisesPageSkeleton } from '../components/loaders/ExercisesPageSkeleton';
import { fetchBatchInitData, fetchExercises, fetchCategories, type Exercise } from '../services/directusApi';
import { useExerciseDetailSheet } from '../contexts/SheetContext';
import { useBugReportSheet } from '../contexts/BugReportSheetContext';
import ArrowCircleRightRounded from '@mui/icons-material/ArrowCircleRightRounded';

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

  const contentRef = useRef<HTMLDivElement>(null);
  const filterPillsRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammaticallyRef = useRef(false);
  const filterPillsHeightRef = useRef(0);
  const stickyTopRef = useRef(66);  // Будет пересчитана динамически
  const [stickyBarOffset, setStickyBarOffset] = useState(-128);


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
            );
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

  // Динамически рассчитываем высоту для скролла к категориям
  // Это фиксит проблему на iPhone 11 Pro где высота элементов отличается
  useEffect(() => {
    if (!loading && filterPillsRef.current) {
      // Измеряем реальную высоту filterPills ТОЛЬКО
      // Header находится СНАРУЖИ contentRef, поэтому его не учитываем
      // offsetTop рассчитывается ВНУТРИ contentRef (скроллируемого контейнера)
      const filterPillsHeight = filterPillsRef.current.offsetHeight;

      stickyTopRef.current = filterPillsHeight;
      console.log(`[ExercisesPage] Calculated STICKY_TOP: ${filterPillsHeight}px (filterPills only)`);
    }
  }, [loading, categories.length]);

  // Управляем позицией sticky bar на основе скролла
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const handleScroll = () => {
      // Измеряем высоту filter pills при первом скролле если ещё не измерена
      if (filterPillsHeightRef.current === 0) {
        const filterPills = filterPillsRef.current;
        if (filterPills) {
          filterPillsHeightRef.current = filterPills.offsetHeight;
        }
      }

      // Вычисляем offset на основе значения из Ref
      const filterHeight = filterPillsHeightRef.current;
      const offset = Math.max(0, filterHeight - root.scrollTop);
      setStickyBarOffset(-offset);
    };

    root.addEventListener('scroll', handleScroll, { passive: true });
    return () => root.removeEventListener('scroll', handleScroll);
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

    // Используем динамически рассчитанное значение вместо жесткого STICKY_TOP
    // Это фиксит проблему на iPhone 11 Pro где высота элементов отличается
    const targetScrollTop = el.offsetTop - stickyTopRef.current;
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

      // Используем динамически рассчитанную высоту для определения активной категории
      // targetPosition это позиция на экране где должна быть категория (в px от верха)
      const targetPosition = stickyTopRef.current;
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
    <div className="w-full h-full bg-bg-1 flex flex-col">
      {/* Header - не растягивается */}
      <div className="flex-shrink-0 bg-bg-1 relative z-[51]">
        <HeaderWithBackButton
          backButtonLabel={dateLabel}
          onBack={onBack}
          onOpenBugReport={() => openBugReportSheet('Упражнения')}
        />
      </div>


      {/* Main scrollable content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto pb-[80px]"
      >
        {/* Category filter cloud - only show when not loading */}
        {!loading && (
          <div ref={filterPillsRef} id="filter-pills" className="flex flex-wrap gap-2 px-3 pt-1.5 pb-0 -mb-2">
            {categories.map((category) => (
              <FilterPill
                key={category}
                label={category}
                isActive={false}
                onClick={() => scrollToSection(category)}
              />
            ))}
          </div>
        )}

        {/* Sticky tags bar - поднимается вверх при скролле */}
        <div
          className="fixed top-[32px] left-0 right-0 z-50 bg-bg-1 border-b border-stroke-1 transition-all duration-100 pt-8"
          style={{
            transform: `translateY(${stickyBarOffset}px)`,
            opacity: stickyBarOffset > -128 ? 1 : 0,
            pointerEvents: stickyBarOffset > -128 ? 'auto' : 'none'
          }}
        >
          <StickyTagsBar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryClick={scrollToSection}
          />
        </div>

        {loading ? (
          <ExercisesPageSkeleton />
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
                  className="px-3 pt-[52px] -mb-2"
                >
                  {/* Category title */}
                  <h2 className="text-fg-1 text-heading-md mb-3">
                    {category}
                  </h2>

                  {/* Exercises grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

        {/* Spacer for fixed button */}
        {selectedExercises.length > 0 && <div className="h-22" />}
      </div>

      {/* Fixed Button at bottom */}
      {selectedExercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg-1 z-40">
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
