import * as React from 'react';

export interface WeekdaysProps {
  weekDays?: string[];
}

export const Weekdays = React.forwardRef<HTMLDivElement, WeekdaysProps>(
  ({ weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'] }, ref) => {
    return (
      <div
        ref={ref}
        className="w-full bg-bg-1"
        style={{ borderBottom: '1px solid var(--stroke-1)' }}
      >
        <div className="grid grid-cols-7 gap-0">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-fg-3"
              style={{ fontSize: '10px', paddingBottom: '8px' }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

Weekdays.displayName = 'Weekdays';
