import React from 'react'
import { Button } from '../main-components/Button'
import { DefaultStroke } from '../main-components/MonthStats'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'

export interface WorkoutSession {
  id: string
  started_at: string
  exerciseCount: number
}

export interface WorkoutCardProps {
  session: WorkoutSession
  isMenuOpen: boolean
  onMenuToggle: () => void
  onOpen: (sessionId: string, startedAt: string) => void
  onDelete: () => void
}

export function WorkoutCard({
  session,
  isMenuOpen,
  onMenuToggle,
  onOpen,
  onDelete
}: WorkoutCardProps) {
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

  return (
    <div
      className="bg-bg-2 rounded-[12px] overflow-hidden flex flex-col"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Info section */}
      <div className="px-3 pt-3 pb-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          {/* Title */}
          <span
            className="text-fg-2 tracking-tight leading-6"
            style={{
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '-3%',
              fontWeight: '500'
            }}
          >
            Тренировка {formatTime(session.started_at)}
          </span>

          {/* Menu button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button
              priority="tertiary"
              tone="default"
              size="S"
              leftIcon={<MoreVertRounded />}
              onClick={onMenuToggle}
              aria-label="Session menu"
            />

            {/* Menu dropdown */}
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-bg-2 border border-stroke-1 rounded-lg shadow-lg z-10 min-w-48">
                <button
                  onClick={() => {
                    onDelete()
                  }}
                  className="w-full text-left px-4 py-2 text-fg-error hover:bg-bg-3 transition-colors first:rounded-t-lg text-sm"
                >
                  Удалить тренировку
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-stroke-1">
          <DefaultStroke label="Упражнений" value={session.exerciseCount} />
        </div>
      </div>

      {/* Button section */}
      <div>
        <Button
          priority="primary"
          tone="default"
          size="M"
          className="w-full"
          style={{ borderRadius: '0' }}
          onClick={() => onOpen(session.id, session.started_at)}
        >
          Открыть тренировку
        </Button>
      </div>
    </div>
  )
}
