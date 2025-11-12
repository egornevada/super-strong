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
      {/* Header with Title and Close Button */}
      <Header
        title={title}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {children}
      </div>
    </div>
  )
}
