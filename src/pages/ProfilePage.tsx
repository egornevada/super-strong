import { useState } from 'react'
import { PageLayout } from '../components/PageLayout'

interface UserStats {
  username: string
  daysSinceStart: number
  totalWeightLifted: number
  totalSets: number
}

interface ProfilePageProps {
  onClose?: () => void
}

export function ProfilePage({ onClose }: ProfilePageProps) {
  const [stats] = useState<UserStats>({
    username: '@egornevada',
    daysSinceStart: 14,
    totalWeightLifted: 14456,
    totalSets: 144,
  })

  return (
    <PageLayout title="Профиль" onClose={onClose}>
      <h2 className="text-fg-1 text-2xl font-semibold mb-6">Профиль</h2>

      {/* Account section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-fg-3">Аккаунт</span>
          <span className="text-fg-1 font-medium">{stats.username}</span>
        </div>
      </div>

      {/* Stats section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-stroke-1">
          <span className="text-fg-3">Пользуетесь Super Strong</span>
          <span className="text-fg-1 font-medium">{stats.daysSinceStart} дней</span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-stroke-1">
          <span className="text-fg-3">Всего подняли</span>
          <span className="text-fg-1 font-medium">{stats.totalWeightLifted.toLocaleString()} кг</span>
        </div>

        <div className="py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-fg-3">Выполнено подходов</span>
            <span className="text-fg-1 font-medium">{stats.totalSets}</span>
          </div>
          <p className="text-fg-4 text-sm">Скоро тут будет больше статистики</p>
        </div>
      </div>

      {/* Placeholder for more stats */}
      <div className="mt-8 pt-8 border-t border-stroke-1">
        <p className="text-fg-3 text-center text-sm">Дополнительные статистики загружаются...</p>
      </div>
    </PageLayout>
  )
}
