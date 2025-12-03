import { useEffect, useMemo, useState } from 'react';
import { ModalBig, DefaultStroke } from '../components';
import { useTelegram } from '../hooks/useTelegram';
import { useUser } from '../contexts/UserContext';
import { useProfileSheet } from '../contexts/ProfileSheetContext';
import { getUserSession } from '../services/authApi';
import {
  getProfileStats,
  PROFILE_STATS_STORAGE_KEY,
  type ProfileStatsSummary
} from '../lib/profileStats';

interface ProfilePageProps {
  onClose?: () => void;
}

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2
});

const pluralize = (value: number, forms: [string, string, string]) => {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

const formatDaysLabel = (days: number) => {
  if (!days || days <= 0) {
    return '0 дней';
  }

  return `${days} ${pluralize(days, ['день', 'дня', 'дней'])}`;
};

const formatSetsLabel = (sets: number) => {
  if (!sets || sets <= 0) {
    return '0';
  }

  return numberFormatter.format(sets);
};

export function ProfilePage({ onClose }: ProfilePageProps) {
  const { user: telegramUser } = useTelegram();
  const { currentUser } = useUser();
  const { sheet } = useProfileSheet();
  const [stats, setStats] = useState<ProfileStatsSummary>(() => {
    return getProfileStats(currentUser?.created_at);
  });

  // Update stats when currentUser changes (e.g., after initial load)
  useEffect(() => {
    if (currentUser?.created_at) {
      setStats(getProfileStats(currentUser.created_at));
    }
  }, [currentUser?.created_at]);

  useEffect(() => {
    if (sheet.isOpen) {
      setStats(getProfileStats(currentUser?.created_at));

      // Update stats every 500ms while sheet is open (since StorageEvent doesn't fire in same tab)
      const interval = setInterval(() => {
        setStats(getProfileStats(currentUser?.created_at));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [sheet.isOpen, currentUser?.created_at]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_STATS_STORAGE_KEY) {
        setStats(getProfileStats(currentUser?.created_at));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentUser?.created_at]);

  const accountLabel = useMemo(() => {
    // First use current user from context
    if (currentUser?.username) {
      return `@${currentUser.username}`;
    }

    // Then check for Telegram user
    if (telegramUser?.username) {
      return `@${telegramUser.username}`;
    }
    if (telegramUser?.first_name) {
      const lastName = telegramUser.last_name ? ` ${telegramUser.last_name}` : '';
      return `${telegramUser.first_name}${lastName}`;
    }
    return 'Гость, браузер';
  }, [currentUser?.username, telegramUser]);

  const daysUsingAppLabel = formatDaysLabel(stats.daysSinceUserCreation);
  const workoutDaysLabel = formatDaysLabel(stats.workoutsCompleted);

  return (
    <ModalBig title="Профиль" onClose={onClose}>
      <div className="mx-4">
        {/* Account section */}
        <div className="py-4 border-b border-stroke-1">
          <DefaultStroke label="Аккаунт" value={accountLabel} />
        </div>

        {/* Stats section */}
        <div className="space-y-0">
          <div className="py-4 border-b border-stroke-1">
            <DefaultStroke label="Пользуетесь Super Strong" value={daysUsingAppLabel} />
          </div>

          <div className="py-4 border-b border-stroke-1">
            <DefaultStroke label="Занимались дней" value={workoutDaysLabel} />
          </div>
        </div>

        {/* Placeholder for more stats */}
        <div className="py-4">
          <p className="text-fg-3 text-center text-sm">Скоро тут появится больше статистики...</p>
        </div>
      </div>
    </ModalBig>
  );
}
