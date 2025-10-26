import { useState } from 'react';
import { Header, Calendar, Button, Weekdays } from '../components';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

interface CalendarPageProps {
  onDayClick?: (day: number, month: number, year: number) => void;
}

export function CalendarPage({ onDayClick }: CalendarPageProps) {
  const today = new Date();
  const [workoutDays, setWorkoutDays] = useState<number[]>([8, 15, 23]);

  const handleDayClick = (day: number) => {
    // Если передана функция onDayClick (для навигации на ExercisesPage),
    // используем её. Иначе работаем как раньше.
    if (onDayClick) {
      onDayClick(day, today.getMonth(), today.getFullYear());
    } else {
      setWorkoutDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    }
  };

  return (
    <div className="w-full h-full bg-bg-1 flex flex-col">
      {/* Header with logo and buttons */}
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
            />
            <Button
              priority="secondary"
              tone="default"
              size="md"
              leftIcon={<SettingsRoundedIcon />}
              aria-label="Settings"
              iconOnly
            />
          </>
        }
      />

      {/* Weekdays header - fixed */}
      <Weekdays />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Calendar
          month={today.getMonth()}
          year={today.getFullYear()}
          workoutDays={workoutDays}
          onDayClick={handleDayClick}
        />
      </div>
    </div>
  );
}
