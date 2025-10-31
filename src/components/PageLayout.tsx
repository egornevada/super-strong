import React from 'react'
import { Header } from './headers/HeaderCalendar'
import { Button } from './main/Button'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

export interface PageLayoutProps {
  title: string
  onClose?: () => void
  children: React.ReactNode
}

export function PageLayout({ title, onClose, children }: PageLayoutProps) {
  return (
    <div className="w-full h-full bg-bg-1 flex flex-col relative">
      {/* Header with Logo and Close Button */}
      <Header
        rightSlot={
          <Button
            priority="secondary"
            tone="default"
            size="md"
            leftIcon={<CloseRoundedIcon />}
            aria-label="Close"
            iconOnly
            onClick={onClose}
          />
        }
      />

      {/* Title */}
      <div className="px-4 pt-6 pb-4 border-b border-stroke-1">
        <h3 className="text-fg-1 font-semibold text-lg">{title}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
