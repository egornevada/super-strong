import React from 'react'
import CloseIcon from '@mui/icons-material/Close'

export interface PageLayoutProps {
  title: string
  onClose?: () => void
  children: React.ReactNode
}

export function PageLayout({ title, onClose, children }: PageLayoutProps) {
  return (
    <div className="w-full h-full bg-bg-1 flex flex-col relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-0 hover:opacity-70 transition-opacity z-10"
      >
        <CloseIcon className="text-fg-1 text-2xl" />
      </button>

      {/* Header */}
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
