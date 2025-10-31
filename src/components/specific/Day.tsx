import * as React from 'react';

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');

export interface DayProps {
  day: number;
  month: number;
  year: number;
  isCurrentMonth?: boolean;
  isCurrentDay?: boolean;
  hasWorkout?: boolean;
  onClick?: (day: number, month: number, year: number) => void;
}

export const Day = React.forwardRef<HTMLButtonElement, DayProps>(
  ({ day, month, year, isCurrentMonth = true, isCurrentDay = false, hasWorkout = false, onClick }, ref) => {
    // Не показываем дни из других месяцев
    if (!isCurrentMonth) {
      return <div className="p-1" />;
    }

    // StateLayer для разных состояний
    const stateLayerStyle = isCurrentDay
      ? {
          '--layer-hover': 'var(--state-default-hover)',
          '--layer-pressed': 'var(--state-default-pressed)'
        }
      : {
          '--layer-hover': 'var(--state-default-hover)',
          '--layer-pressed': 'var(--state-default-pressed)'
        };

    return (
      <div className="border-t" style={{ borderColor: 'var(--stroke-1)', padding: '4px' }}>
        <button
          ref={ref}
          onClick={() => onClick?.(day, month, year)}
          className={cx(
            'group relative w-full flex flex-col items-center rounded-xl transition-all overflow-hidden',
            isCurrentDay
              ? 'bg-bg-brand text-fg-inverted'
              : 'bg-transparent text-fg-1'
          )}
          style={{
            ...stateLayerStyle,
            height: '64px',
            paddingTop: '12px'
          } as React.CSSProperties}
        >
          {/* StateLayer */}
          <span
            aria-hidden
            className="
              pointer-events-none absolute inset-0 z-0
              transition-[background-color] duration-150
              [background:transparent]
              group-hover:[background:var(--layer-hover)]
              group-active:[background:var(--layer-pressed)]
            "
          />

          {/* Контент дня */}
          <span
            className="relative z-[1]"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '-4%'
            }}
          >
            {day}
          </span>

          {/* Workout indicator dot */}
          {hasWorkout && (
            <span
              className={cx(
                'absolute z-[1] rounded-full transition-colors',
                isCurrentDay ? 'bg-fg-inverted' : 'bg-fg-1'
              )}
              style={{ width: '8px', height: '8px', bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}
            />
          )}
        </button>
      </div>
    );
  }
);

Day.displayName = 'Day';
