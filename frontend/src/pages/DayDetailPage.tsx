import React, { useState, useEffect } from 'react'
import { Button, AlertDialog, HeaderWithBackButton, WorkoutCard, type WorkoutSession } from '../components'
import { logger } from '../lib/logger'
import { getWorkoutSessionsWithCount } from '../services/workoutsApi'
import { useOptimisticDeleteWorkout } from '../hooks/useOptimisticDeleteWorkout'
import AddRounded from '@mui/icons-material/AddRounded'

interface SelectedDate {
  day: number
  month: number
  year: number
}

interface DayDetailPageProps {
  userDayId: string
  date: SelectedDate
  onBack?: () => void
  onStartNewWorkout?: () => void
  onOpenWorkout?: (workoutSessionId: string, startedAt: string) => void
  onWorkoutDeleted?: () => void
}

export function DayDetailPage({
  userDayId,
  date,
  onWorkoutDeleted,
  onBack,
  onStartNewWorkout,
  onOpenWorkout
}: DayDetailPageProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedSessionForDelete, setSelectedSessionForDelete] = useState<WorkoutSession | null>(null)
  const [sessionMenuOpen, setSessionMenuOpen] = useState<string | null>(null)

  // Hook для оптимистического удаления
  // Источник: https://react.dev/reference/react/useOptimistic
  const {
    optimisticSessions,
    deleteWorkout,
    isDeleting
  } = useOptimisticDeleteWorkout({
    sessions,
    onSuccess: async () => {
      logger.info('Workout deleted successfully, calling parent callback')

      // 1. Перезагружаем sessions на этой странице
      try {
        const updatedSessions = await getWorkoutSessionsWithCount(userDayId)
        setSessions(updatedSessions)
        logger.info('Sessions reloaded on DayDetailPage', { count: updatedSessions.length })
      } catch (error: unknown) {
        logger.error('Failed to reload sessions on DayDetailPage', { error })
      }

      // 2. Уведомляем родителя для обновления календаря и статистики
      onWorkoutDeleted?.()
    },
    onError: (error: Error) => {
      logger.error('Delete error:', error)
    }
  })

  const monthNamesShort = [
    'Янв.',
    'Фев.',
    'Мар.',
    'Апр.',
    'Май',
    'Июн.',
    'Июл.',
    'Авг.',
    'Сен.',
    'Окт.',
    'Ноя.',
    'Дек.'
  ]

  const monthNamesFull = [
    'Января',
    'Февраля',
    'Марта',
    'Апреля',
    'Мая',
    'Июня',
    'Июля',
    'Августа',
    'Сентября',
    'Октября',
    'Ноября',
    'Декабря'
  ]

  const dateStr = `${date.day} ${monthNamesFull[date.month]} ${date.year}`
  const dateLabel = `${date.day} ${monthNamesShort[date.month]}`

  // Load workout sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        logger.debug('Loading workout sessions for day', { userDayId })

        const workoutSessions = await getWorkoutSessionsWithCount(userDayId)
        setSessions(workoutSessions)

        logger.info('Workout sessions loaded successfully', { count: workoutSessions.length })
      } catch (error) {
        logger.error('Failed to load workout sessions', { userDayId, error })
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [userDayId])

  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    } catch {
      return 'N/A'
    }
  }

  const handleDeleteClick = (session: WorkoutSession) => {
    setSelectedSessionForDelete(session)
    setDeleteModalOpen(true)
    setSessionMenuOpen(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedSessionForDelete) return

    try {
      logger.debug('User confirmed deletion', { sessionId: selectedSessionForDelete.id })

      // Вызываем hook который:
      // 1. Обновляет UI СРАЗУ (оптимистично)
      // 2. Отправляет API запрос в ФОНЕ
      // 3. На успех - вызывает onSuccess callback
      // Источник: https://react.dev/reference/react/useOptimistic
      await deleteWorkout(selectedSessionForDelete.id)

      logger.info('Deletion initiated', { sessionId: selectedSessionForDelete.id })
      setDeleteModalOpen(false)
      setSelectedSessionForDelete(null)
    } catch (error) {
      logger.error('Failed to initiate deletion', { sessionId: selectedSessionForDelete.id, error })
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-bg-1">
      {/* Header */}
      <div className="bg-bg-1">
        <HeaderWithBackButton
          backButtonLabel={dateLabel}
          onBack={onBack}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!loading && optimisticSessions.length > 0 && (
          <h2 className="text-fg-1 text-heading-md mb-4">{dateStr}</h2>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-fg-2">Загрузка тренировок...</p>
          </div>
        ) : optimisticSessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-fg-1 text-lg font-semibold mb-2">Тренировок не найдено</p>
            <p className="text-fg-2 text-sm">Нажми "Новая тренировка" чтобы начать</p>
          </div>
        ) : (
          <div className="space-y-3">
            {optimisticSessions.map((session: WorkoutSession) => (
              <WorkoutCard
                key={session.id}
                session={session}
                isMenuOpen={sessionMenuOpen === session.id}
                onMenuToggle={() => setSessionMenuOpen(sessionMenuOpen === session.id ? null : session.id)}
                onOpen={onOpenWorkout || (() => {})}
                onDelete={() => {
                  setSessionMenuOpen(null)
                  handleDeleteClick(session)
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom spacer for button */}
        <div className="h-24" />
      </div>

      {/* New workout button */}
      <div className="bg-bg-1">
        <Button
          priority="secondary"
          tone="default"
          size="M"
          className="w-full rounded-none pt-4 pb-6"
          style={{ borderRadius: '0', height: '64px' }}
          leftIcon={<AddRounded />}
          onClick={onStartNewWorkout}
        >
          Новая тренировка
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      {selectedSessionForDelete && (
        <AlertDialog
          isOpen={deleteModalOpen}
          title="Удалить тренировку?"
          message={`Тренировка в ${formatTime(selectedSessionForDelete.started_at)} с ${selectedSessionForDelete.exerciseCount} упражнениями будет удалена.`}
          isDangerous={true}
          confirmText={isDeleting ? 'Удаление...' : 'Удалить'}
          cancelText="Отмена"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false)
            setSelectedSessionForDelete(null)
          }}
        />
      )}
    </div>
  )
}
