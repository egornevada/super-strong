import React, { useState, useEffect } from 'react'
import { Button, AlertDialog } from '../components'
import { logger } from '../lib/logger'
import { getWorkoutSessionsWithCount, deleteWorkoutSessionWithExercises } from '../services/workoutsApi'
import AddRounded from '@mui/icons-material/AddRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import { useUser } from '../contexts/UserContext'

interface SelectedDate {
  day: number
  month: number
  year: number
}

interface WorkoutSession {
  id: string
  started_at: string
  exerciseCount: number
}

interface DayDetailPageProps {
  userDayId: string
  date: SelectedDate
  onBack?: () => void
  onStartNewWorkout?: () => void
  onOpenWorkout?: (workoutSessionId: string, startedAt: string) => void
}

export function DayDetailPage({
  userDayId,
  date,
  onBack,
  onStartNewWorkout,
  onOpenWorkout
}: DayDetailPageProps) {
  const { currentUser } = useUser()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedSessionForDelete, setSelectedSessionForDelete] = useState<WorkoutSession | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sessionMenuOpen, setSessionMenuOpen] = useState<string | null>(null)

  const monthNames = [
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

  const dateStr = `${date.day} ${monthNames[date.month]} ${date.year}`

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
      setIsDeleting(true)
      logger.debug('Deleting workout session', { sessionId: selectedSessionForDelete.id })

      await deleteWorkoutSessionWithExercises(selectedSessionForDelete.id)

      // Remove from list
      setSessions(prev => prev.filter(s => s.id !== selectedSessionForDelete.id))

      logger.info('Workout session deleted successfully', { sessionId: selectedSessionForDelete.id })
      setDeleteModalOpen(false)
      setSelectedSessionForDelete(null)
    } catch (error) {
      logger.error('Failed to delete workout session', { sessionId: selectedSessionForDelete.id, error })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-bg-1">
      {/* Header */}
      <div className="bg-bg-1 px-4 py-4 border-b border-stroke-1">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="text-fg-1 hover:opacity-70 transition-opacity"
            aria-label="Go back"
          >
            ← Назад
          </button>
          <div className="flex items-center gap-2 bg-bg-2 px-4 py-2 rounded-full">
            <span className="text-lg">📅</span>
            <span className="text-fg-1 text-sm font-medium">{dateStr}</span>
          </div>
        </div>

        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bg-brand rounded-full flex items-center justify-center">
            <span className="text-lg">💪</span>
          </div>
          <h1 className="text-fg-1 text-heading-md">Super Strong</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h2 className="text-fg-1 text-heading-md mb-4">{dateStr}</h2>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-fg-2">Загрузка тренировок...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-fg-1 text-lg font-semibold mb-2">Тренировок не найдено</p>
            <p className="text-fg-2 text-sm">Нажми "Новая тренировка" чтобы начать</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => onOpenWorkout?.(session.id, session.started_at)}
                className="bg-bg-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏋️</span>
                    <h3 className="text-fg-1 font-medium">
                      Тренировка в {formatTime(session.started_at)}
                    </h3>
                  </div>
                  <p className="text-fg-3 text-sm">
                    Упражнений: {session.exerciseCount}
                  </p>
                </div>

                {/* Menu button */}
                <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSessionMenuOpen(sessionMenuOpen === session.id ? null : session.id)}
                    className="p-2 hover:opacity-70 transition-opacity"
                    aria-label="Session menu"
                  >
                    <MoreVertRounded style={{ fontSize: 20 }} />
                  </button>

                  {/* Menu dropdown */}
                  {sessionMenuOpen === session.id && (
                    <div className="absolute top-full right-0 mt-1 bg-bg-2 border border-stroke-1 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={() => {
                          setSessionMenuOpen(null)
                          handleDeleteClick(session)
                        }}
                        className="w-full text-left px-4 py-2 text-fg-error hover:bg-bg-3 transition-colors first:rounded-t-lg text-sm"
                      >
                        Удалить тренировку
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom spacer for button */}
        <div className="h-24" />
      </div>

      {/* New workout button */}
      <div className="bg-bg-1 px-4 py-4">
        <Button
          priority="secondary"
          tone="default"
          size="md"
          className="w-full"
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
