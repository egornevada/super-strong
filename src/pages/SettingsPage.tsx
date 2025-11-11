import { useState } from 'react'
import { PageLayout, DefaultStroke } from '../components'
import { useTelegram } from '../hooks/useTelegram'
import { deleteAccountAndClose, closeTelegramApp, showTelegramConfirm } from '../lib/telegram'
import { userActions, logger } from '../lib/logger'
import { getUserSession, clearUserSession } from '../services/authApi'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { Button } from '../components/main/Button'

interface SettingsPageProps {
  onClose?: () => void
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { user: telegramUser } = useTelegram()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = () => {
    logger.info('Logout initiated')
    const session = getUserSession()
    if (session) {
      // For session-based login, clear session and reload
      clearUserSession()
      window.location.reload()
    } else {
      // For Telegram, close the app
      closeTelegramApp()
    }
  }

  const handleDeleteAccount = async () => {
    showTelegramConfirm(
      'Вы уверены? Это удалит ваш аккаунт и все данные навсегда.',
      async (confirmed) => {
        if (!confirmed) {
          logger.info('Account deletion cancelled')
          return
        }

        setIsDeleting(true)
        userActions.deleteAccount(telegramUser?.username)
        const success = await deleteAccountAndClose()

        if (!success) {
          setIsDeleting(false)
        }
      }
    )
  }

  return (
    <PageLayout title="Настройки" onClose={onClose}>
      <div className="mx-4">
        {/* About section */}
        <div>
          <h2 className="text-fg-1 font-semibold">О приложении</h2>
          <div className="space-y-0">
            <div className="py-4 border-b border-stroke-1">
              <DefaultStroke label="Версия" value="Pre-Classic" />
            </div>
            <div className="py-4 border-b border-stroke-1">
              <DefaultStroke label="Сборка" value="10.11.2025" />
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="py-4">
          <h2 className="text-fg-1 font-semibold mb-4">Опасная зона</h2>
          <div className="space-y-3">
            {/* Logout button */}
            <Button
              priority="secondary"
              tone="default"
              size="md"
              className="w-full"
              leftIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
            >
              Выход
            </Button>

            {/* Delete account button */}
            <Button
              priority="secondary"
              tone="default"
              size="md"
              className="w-full text-red-500 hover:bg-red-50"
              leftIcon={<DeleteRoundedIcon />}
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить аккаунт'}
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
