import { Header, Calendar, Button, Weekdays } from '../components';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useProfileSheet } from '../contexts/ProfileSheetContext';
import { useSettingsSheet } from '../contexts/SettingsSheetContext';

interface CalendarPageProps {
  onDayClick?: (day: number, month: number, year: number) => void;
  onMonthChange?: (month: number, year: number) => void;
  workoutDays?: string[];
}

export function CalendarPage({ onDayClick, onMonthChange, workoutDays = [] }: CalendarPageProps) {
  const { openProfileSheet } = useProfileSheet();
  const { openSettingsSheet } = useSettingsSheet();
  const today = new Date();

  const handleDayClick = (day: number, month: number, year: number) => {
    if (onDayClick) {
      onDayClick(day, month, year);
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    if (onMonthChange) {
      onMonthChange(month, year);
    }
  };

  return (
    <div className="w-full h-full bg-bg-3 flex flex-col">
      {/* Outer page background - bg-bg-3 */}

      {/* Content container - bg-bg-1 with rounded corners */}
      <div className="flex-1 bg-bg-1 rounded-3xl shadow-card flex flex-col overflow-hidden">
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

        {/* Weekdays header - fixed */}
        <Weekdays />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Calendar
            month={today.getMonth()}
            year={today.getFullYear()}
            workoutDays={workoutDays}
            onDayClick={handleDayClick}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>
    </div>
  );
}
