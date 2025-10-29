import { Header, Calendar, Button, Weekdays } from '../components';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

interface CalendarPageProps {
  onDayClick?: (day: number, month: number, year: number) => void;
  workoutDays?: number[];
}

export function CalendarPage({ onDayClick, workoutDays = [] }: CalendarPageProps) {
  const today = new Date();

  const handleDayClick = (day: number) => {
    if (onDayClick) {
      onDayClick(day, today.getMonth(), today.getFullYear());
    }
  };

  return (
    <div className="w-full h-full bg-bg-3 flex flex-col">
      {/* Outer page background - bg-bg-3 */}

      {/* Content container - bg-bg-1 with rounded corners */}
      <div className="flex-1 bg-bg-1 rounded-3xl shadow-card overflow-hidden flex flex-col">
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
    </div>
  );
}
