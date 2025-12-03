import React from 'react'
import { Header, Button } from '../index'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

export interface ModalBigProps {
  title: string
  onClose?: () => void
  children: React.ReactNode
}

export function ModalBig({ title, onClose, children }: ModalBigProps) {
  return (
    <div className="w-full h-full bg-bg-1 flex flex-col relative">
      {/* Header with Title and Close Button */}
      <Header
        title={title}
        rightSlot={
          <Button
            priority="secondary"
            tone="default"
            size="M"
            leftIcon={<CloseRoundedIcon />}
            aria-label="Close"
            iconOnly
            onClick={onClose}
          />
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto pt-4 px-3">
        {children}
      </div>
    </div>
  )
}
