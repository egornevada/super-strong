import * as React from 'react';
import { Day } from './Day';

export interface CalendarProps {
  month?: number;
  year?: number;
  workoutDays?: number[];
  onDayClick?: (day: number) => void;
  onMonthChange?: (month: number, year: number) => void;
}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ month, year, workoutDays = [], onDayClick, onMonthChange }, ref) => {
    const today = new Date();
    const [displayMonth, setDisplayMonth] = React.useState(month ?? today.getMonth());
    const [displayYear, setDisplayYear] = React.useState(year ?? today.getFullYear());

    // Month names in Russian
    const monthNames = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ];

    // Функция для генерации дней месяца
    const getMonthDays = (monthIndex: number, yearIndex: number) => {
      const firstDay = new Date(yearIndex, monthIndex, 1).getDay();
      const daysInMonth = new Date(yearIndex, monthIndex + 1, 0).getDate();

      // Преобразуем getDay() (0=Sunday) в позицию в сетке (0=Monday, 6=Sunday)
      // getDay: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      // grid:    6=Sun, 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat
      const gridColumnStart = firstDay === 0 ? 7 : firstDay; // 1-7, где 1=Monday, 7=Sunday

      const days: Array<{ day: number; isCurrentMonth: boolean; gridColumn?: number }> = [];

      // Первый день месяца должен быть в правильной колонке сетки
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          day: i,
          isCurrentMonth: true,
          gridColumn: i === 1 ? gridColumnStart : undefined
        });
      }

      return { days };
    };

    // Обработка прокрутки месяцев через Intersection Observer
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const monthRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});
    const hasInitialScrolled = React.useRef(false);
    const observerEnabledRef = React.useRef(false);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          // Не обновляем месяц если ещё не закончена инициальная прокрутка
          if (!observerEnabledRef.current) return;

          // Находим месяц, который больше всего пересекается с областью видимости
          let mostVisibleEntry = entries[0];
          for (const entry of entries) {
            if (entry.intersectionRatio > (mostVisibleEntry?.intersectionRatio || 0)) {
              mostVisibleEntry = entry;
            }
          }

          if (mostVisibleEntry && mostVisibleEntry.isIntersecting) {
            const monthStr = mostVisibleEntry.target.getAttribute('data-month');
            if (monthStr) {
              const [m, y] = monthStr.split('-').map(Number);
              setDisplayMonth(m);
              setDisplayYear(y);
              onMonthChange?.(m, y);
            }
          }
        },
        { threshold: [0.1, 0.25, 0.5, 0.75] }
      );

      Object.values(monthRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });

      return () => observer.disconnect();
    }, [onMonthChange]);

    // Прокрутить к текущему месяцу при инициализации
    React.useEffect(() => {
      if (!hasInitialScrolled.current && scrollContainerRef.current && monthRefs.current) {
        const currentMonthKey = `${displayMonth}-${displayYear}`;
        const currentMonthElement = monthRefs.current[currentMonthKey];

        if (currentMonthElement) {
          // Даём небольшую задержку чтобы DOM полностью загрузился
          setTimeout(() => {
            currentMonthElement.scrollIntoView({ behavior: 'auto', block: 'start' });
            hasInitialScrolled.current = true;
            // Включаем Observer только после инициальной прокрутки
            setTimeout(() => {
              observerEnabledRef.current = true;
            }, 100);
          }, 100);
        }
      }
    }, [displayMonth, displayYear]);

    // Генерируем месяцы для прокрутки (текущий год полностью + до и после)
    const months = React.useMemo(() => {
      const result = [];
      const currentDate = new Date();
      const startYear = currentDate.getFullYear() - 1;
      const endYear = currentDate.getFullYear() + 1;

      for (let y = startYear; y <= endYear; y++) {
        for (let m = 0; m < 12; m++) {
          result.push({ month: m, year: y });
        }
      }

      return result;
    }, []);

    return (
      <div ref={ref} className="w-full h-full flex flex-col">
        {/* Scrollable calendar container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto w-full scrollbar-hide calendar-scroll-container"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {months.map(({ month: m, year: y }) => {
            const { days: monthDays } = getMonthDays(m, y);
            const isCurrentMonthDisplay = m === today.getMonth() && y === today.getFullYear();
            const currentDayForMonth = m === today.getMonth() && y === today.getFullYear()
              ? today.getDate()
              : null;
            const monthKey = `${m}-${y}`;

            return (
              <div
                key={monthKey}
                ref={(el) => {
                  if (el) monthRefs.current[monthKey] = el;
                }}
                data-month={monthKey}
                className="w-full"
                style={{ paddingTop: '8px', paddingBottom: '8px' }}
              >
                {/* Month header - aligned to right */}
                <div
                  className="flex justify-end"
                  style={{
                    height: '28px',
                    marginBottom: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px'
                  }}
                >
                  <h2
                    className={isCurrentMonthDisplay ? 'text-bg-brand' : 'text-fg-1'}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '20px',
                      fontWeight: 500,
                      lineHeight: '24px'
                    }}
                  >
                    {(() => {
                      const month = monthNames[m];
                      if (month.length <= 4) {
                        return month;
                      }
                      return month.substring(0, 3) + '.';
                    })()}
                  </h2>
                </div>

                {/* Days grid */}
                <div className="w-full grid grid-cols-7">
                  {/* Days of month */}
                  {monthDays.map((dayObj, idx) => {
                    const isCurrentDay = dayObj.isCurrentMonth && dayObj.day === currentDayForMonth;
                    const hasWorkout = dayObj.isCurrentMonth && workoutDays.includes(dayObj.day);

                    return (
                      <div
                        key={`${monthKey}-${dayObj.day}-${idx}`}
                        style={dayObj.gridColumn ? { gridColumn: dayObj.gridColumn } : undefined}
                      >
                        <Day
                          day={dayObj.day}
                          isCurrentMonth={dayObj.isCurrentMonth}
                          isCurrentDay={isCurrentDay}
                          hasWorkout={hasWorkout}
                          onClick={onDayClick}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Month spacing */}
                <div className="w-full h-8" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Calendar.displayName = 'Calendar';
