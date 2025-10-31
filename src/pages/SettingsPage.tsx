import { useState } from 'react'
import { PageLayout } from '../components/PageLayout'
import { useTelegram } from '../hooks/useTelegram'

interface SettingsPageProps {
  onClose?: () => void
  onGoToStorybook?: () => void
}

export function SettingsPage({ onClose, onGoToStorybook }: SettingsPageProps) {
  const { user: telegramUser } = useTelegram()
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'ru',
  })

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const getUserDisplayInfo = () => {
    if (telegramUser?.username) {
      return `@${telegramUser.username}`
    } else if (telegramUser?.first_name) {
      return telegramUser.first_name
    } else {
      return 'Гость, браузер. Прогресс не сохранится'
    }
  }

  return (
    <PageLayout title="Настройки" onClose={onClose}>
      {/* User info section */}
      <div className="mb-8 p-4 bg-bg-2 rounded-lg">
        <h2 className="text-fg-3 text-sm font-medium mb-2">Профиль</h2>
        <p className="text-fg-1 font-medium">{getUserDisplayInfo()}</p>
      </div>

      {/* Notifications section */}
      <div className="mb-8">
        <h2 className="text-fg-1 font-semibold mb-4">Уведомления</h2>
        <button
          onClick={() => handleToggleSetting('notifications')}
          className="flex items-center justify-between w-full py-3 border-b border-stroke-1"
        >
          <span className="text-fg-1">Включить уведомления</span>
          <div className={`w-12 h-6 rounded-full transition-colors ${
            settings.notifications ? 'bg-brand-500' : 'bg-bg-2'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
              settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
            } mt-0.5`} />
          </div>
        </button>
      </div>

      {/* Display section */}
      <div className="mb-8">
        <h2 className="text-fg-1 font-semibold mb-4">Вид</h2>
        <button
          onClick={() => handleToggleSetting('darkMode')}
          className="flex items-center justify-between w-full py-3 border-b border-stroke-1"
        >
          <span className="text-fg-1">Тёмная тема</span>
          <div className={`w-12 h-6 rounded-full transition-colors ${
            settings.darkMode ? 'bg-brand-500' : 'bg-bg-2'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
              settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
            } mt-0.5`} />
          </div>
        </button>
      </div>

      {/* Developer section */}
      <div className="mb-8">
        <h2 className="text-fg-1 font-semibold mb-4">Разработка</h2>
        <button
          onClick={() => {
            onClose?.()
            onGoToStorybook?.()
          }}
          className="w-full py-3 px-4 bg-bg-2 hover:bg-bg-3 rounded-lg transition-colors text-fg-1 text-left font-medium"
        >
          Перейти в Storybook
        </button>
      </div>

      {/* About section */}
      <div className="pt-8 border-t border-stroke-1">
        <h2 className="text-fg-1 font-semibold mb-4">О приложении</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-fg-3">Версия</span>
            <span className="text-fg-1">0.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-3">Сборка</span>
            <span className="text-fg-1">#20251030</span>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
