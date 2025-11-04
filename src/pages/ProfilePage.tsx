import { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useTelegram } from '../hooks/useTelegram';
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

const formatWeightLabel = (weight: number) => {
  if (!weight || weight <= 0) {
    return '0 кг';
  }

  return `${numberFormatter.format(weight)} кг`;
};

const formatSetsLabel = (sets: number) => {
  if (!sets || sets <= 0) {
    return '0';
  }

  return numberFormatter.format(sets);
};

export function ProfilePage({ onClose }: ProfilePageProps) {
  const { user: telegramUser } = useTelegram();
  const { sheet } = useProfileSheet();
  const [stats, setStats] = useState<ProfileStatsSummary>(() => {
    const session = getUserSession();
    return getProfileStats(session?.created_at);
  });

  useEffect(() => {
    if (sheet.isOpen) {
      const session = getUserSession();
      setStats(getProfileStats(session?.created_at));

      // Update stats every 500ms while sheet is open (since StorageEvent doesn't fire in same tab)
      const interval = setInterval(() => {
        const session = getUserSession();
        setStats(getProfileStats(session?.created_at));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [sheet.isOpen]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_STATS_STORAGE_KEY) {
        const session = getUserSession();
        setStats(getProfileStats(session?.created_at));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const accountLabel = useMemo(() => {
    // First check for session username (from modal login)
    const session = getUserSession();
    if (session?.username) {
      return `@${session.username}`;
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
  }, [telegramUser]);

  const daysUsingAppLabel = formatDaysLabel(stats.daysSinceUserCreation);
  const totalWeightLabel = formatWeightLabel(stats.totalWeight);
  const workoutDaysLabel = formatDaysLabel(stats.workoutsCompleted);

  return (
    <PageLayout title="Профиль" onClose={onClose}>
      <div className="mx-4">
        {/* Account section */}
        <div className="pb-4 border-b border-stroke-1">
          <div className="flex justify-between items-center">
            <span className="text-fg-3">Аккаунт</span>
            <span className="text-fg-1 font-medium truncate max-w-[60%]" title={accountLabel}>
              {accountLabel}
            </span>
          </div>
        </div>

        {/* Stats section */}
        <div className="space-y-0">
          <div className="flex justify-between items-center py-4 border-b border-stroke-1">
            <span className="text-fg-3">Пользуетесь Super Strong</span>
            <span className="text-fg-1 font-medium">{daysUsingAppLabel}</span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-stroke-1">
            <span className="text-fg-3">Всего подняли</span>
            <span className="text-fg-1 font-medium">{totalWeightLabel}</span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-stroke-1">
            <span className="text-fg-3">Занимались дней</span>
            <span className="text-fg-1 font-medium">{workoutDaysLabel}</span>
          </div>
        </div>

        {/* Placeholder for more stats */}
        <div className="py-4">
          <p className="text-fg-3 text-center text-sm">Скоро тут появится больше статистики...</p>
        </div>
      </div>
    </PageLayout>
  );
}
