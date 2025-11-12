import * as React from 'react';
import { Day } from './Day';
import { Button } from '../main/Button';
import { Weekdays } from './Weekdays';
import { DefaultStroke } from '../StatItem';
import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded';

export interface CalendarProps {
  month?: number;
  year?: number;
  workoutDays?: string[];
  monthStats?: {
    totalWeight: number;
    totalSets: number;
  };
  onDayClick?: (day: number, month: number, year: number) => void;
  onMonthChange?: (month: number, year: number) => void;
  /**
   * 📖 Called on mouse enter for prefetching adjacent months
   * Source: https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
   */
  onPrefetchPrevMonth?: () => void;
  onPrefetchNextMonth?: () => void;
}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ month, year, workoutDays = [], monthStats, onDayClick, onMonthChange, onPrefetchPrevMonth, onPrefetchNextMonth }, ref) => {
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

    const weekdayShort = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

    // Get days for the current month
    const getMonthDays = (monthIndex: number, yearIndex: number) => {
      const firstDay = new Date(yearIndex, monthIndex, 1).getDay();
      const daysInMonth = new Date(yearIndex, monthIndex + 1, 0).getDate();

      const gridColumnStart = firstDay === 0 ? 7 : firstDay;

      const days: Array<{ day: number; isCurrentMonth: boolean; gridColumn?: number }> = [];

      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          day: i,
          isCurrentMonth: true,
          gridColumn: i === 1 ? gridColumnStart : undefined
        });
      }

      return { days };
    };

    const { days: monthDays } = getMonthDays(displayMonth, displayYear);

    const handlePrevMonth = () => {
      let newMonth = displayMonth - 1;
      let newYear = displayYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = displayYear - 1;
      }
      setDisplayMonth(newMonth);
      setDisplayYear(newYear);
      onMonthChange?.(newMonth, newYear);
    };

    const handleNextMonth = () => {
      let newMonth = displayMonth + 1;
      let newYear = displayYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear = displayYear + 1;
      }
      setDisplayMonth(newMonth);
      setDisplayYear(newYear);
      onMonthChange?.(newMonth, newYear);
    };

    const isCurrentMonthDisplay = displayMonth === today.getMonth() && displayYear === today.getFullYear();
    const currentDayForMonth = isCurrentMonthDisplay ? today.getDate() : null;

    const numberFormatter = new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 2
    });

    return (
      <div ref={ref} className="w-full h-full flex flex-col relative">
        {/* Scrollable calendar content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header with navigation */}
          <div>
            {/* Month title and nav buttons */}
            <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex gap-2">
              <Button
                priority="secondary"
                tone="default"
                size="sm"
                leftIcon={<KeyboardArrowLeftRounded />}
                aria-label="Previous month"
                iconOnly
                onClick={handlePrevMonth}
                onMouseEnter={onPrefetchPrevMonth}
              />
              <Button
                priority="secondary"
                tone="default"
                size="sm"
                leftIcon={<KeyboardArrowRightRounded />}
                aria-label="Next month"
                iconOnly
                onClick={handleNextMonth}
                onMouseEnter={onPrefetchNextMonth}
              />
            </div>

            <h2 className={`${isCurrentMonthDisplay ? 'text-fg-brand' : 'text-fg-1'} text-right flex-1 text-heading-md`}>
              {monthNames[displayMonth]} {displayYear}
            </h2>
          </div>
          </div>

          {/* Weekdays header */}
          <Weekdays />

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0" style={{ boxShadow: 'inset 0 1px 0 0 var(--stroke-1)' }}>
            {monthDays.map((dayObj, idx) => {
              const isCurrentDay = dayObj.isCurrentMonth && dayObj.day === currentDayForMonth;
              const dateKey = `${dayObj.day}-${displayMonth}-${displayYear}`;
              const hasWorkout = dayObj.isCurrentMonth && workoutDays.includes(dateKey);

              return (
                <div
                  key={`${displayMonth}-${dayObj.day}-${idx}`}
                  style={{
                    ...(dayObj.gridColumn ? { gridColumn: dayObj.gridColumn } : {})
                  }}
                >
                  <Day
                    day={dayObj.day}
                    month={displayMonth}
                    year={displayYear}
                    isCurrentMonth={dayObj.isCurrentMonth}
                    isCurrentDay={isCurrentDay}
                    hasWorkout={hasWorkout}
                    onClick={onDayClick}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats section - fixed at bottom */}
        {monthStats && (
          <div className="bg-bg-2 px-3 pt-4 pb-6 rounded-t-[16px] absolute bottom-0 left-0 right-0 z-10" style={{ height: 'auto' }}>
            <h3 className="text-fg-1 mb-3 text-heading-md">Статистика за месяц</h3>

            <div className="space-y-2">
              <DefaultStroke
                label={`Подняли за ${monthNames[displayMonth].toLowerCase()}`}
                value={`${numberFormatter.format(monthStats.totalWeight || 0)} кг`}
              />
              <DefaultStroke
                label="Занимались дней"
                value={monthStats.totalSets || 0}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

Calendar.displayName = 'Calendar';
