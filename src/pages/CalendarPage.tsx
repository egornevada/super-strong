import { useState, useMemo } from 'react';
import { Header, Calendar, Button } from '../components';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useProfileSheet } from '../contexts/ProfileSheetContext';
import { useSettingsSheet } from '../contexts/SettingsSheetContext';

interface CalendarPageProps {
  onDayClick?: (day: number, month: number, year: number) => void | Promise<void>;
  onMonthChange?: (month: number, year: number) => void;
  workoutDays?: string[];
  savedWorkouts?: Map<string, any[]>;
}

export function CalendarPage({ onDayClick, onMonthChange, workoutDays = [], savedWorkouts = new Map() }: CalendarPageProps) {
  const { openProfileSheet } = useProfileSheet();
  const { openSettingsSheet } = useSettingsSheet();
  const today = new Date();
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [displayYear, setDisplayYear] = useState(today.getFullYear());

  const handleDayClick = async (day: number, month: number, year: number) => {
    if (onDayClick) {
      await onDayClick(day, month, year);
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    setDisplayMonth(month);
    setDisplayYear(year);
    onMonthChange?.(month, year);
  };

  // Calculate stats for the current month
  const monthStats = useMemo(() => {
    let totalWeight = 0;
    let totalSets = 0;

    workoutDays.forEach(dateKey => {
      const parts = dateKey.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // Only count workouts from the current display month
        if (month === displayMonth && year === displayYear) {
          totalSets++;

          // Extract weight from savedWorkouts
          const exercises = savedWorkouts.get(dateKey);
          if (exercises && Array.isArray(exercises)) {
            exercises.forEach((exercise: any) => {
              if (exercise.trackSets && Array.isArray(exercise.trackSets)) {
                exercise.trackSets.forEach((set: any) => {
                  totalWeight += (set.reps || 0) * (set.weight || 0);
                });
              }
            });
          }
        }
      }
    });

    return {
      totalWeight,
      totalSets
    };
  }, [workoutDays, displayMonth, displayYear, savedWorkouts]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with logo and buttons */}
      <div className="bg-bg-1">
        <Header
          rightSlot={
            <>
              <Button
                priority="secondary"
                tone="default"
                size="md"
                leftIcon={<AccountCircleRoundedIcon />}
                aria-label="Profile"
                iconOnly
                onClick={openProfileSheet}
              />
              <Button
                priority="secondary"
                tone="default"
                size="md"
                leftIcon={<SettingsRoundedIcon />}
                aria-label="Settings"
                iconOnly
                onClick={openSettingsSheet}
              />
            </>
          }
        />
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden bg-white">
        <Calendar
          month={displayMonth}
          year={displayYear}
          workoutDays={workoutDays}
          monthStats={monthStats}
          onDayClick={handleDayClick}
          onMonthChange={handleMonthChange}
        />
      </div>
    </div>
  );
}
