import React, { useEffect } from 'react'

interface SheetOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function SheetOverlay({ isOpen, onClose, children }: SheetOverlayProps) {
  useEffect(() => {
    if (isOpen) {
      // Предотвращаем скролл body
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop overlay - затемнение с закрытием при клике */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: isOpen
            ? 'opacity 200ms ease-out, visibility 200ms ease-out'
            : 'opacity 200ms ease-in, visibility 200ms ease-in',
        }}
        onClick={onClose}
      />

      {/* Sheet container - выезжает снизу, оставляя 24px сверху */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          opacity: isOpen ? 1 : 0,
          height: 'calc(100dvh - 24px)',
          top: '24px',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: isOpen
            ? 'transform 200ms ease-out, opacity 200ms ease-out, visibility 200ms ease-out'
            : 'transform 200ms ease-in, opacity 200ms ease-in, visibility 200ms ease-in 200ms',
        }}
      >
        {/* Sheet content с rounded corners только сверху */}
        <div className="bg-bg-1 rounded-t-3xl overflow-hidden flex flex-col h-full">
          {children}
        </div>
      </div>
    </>
  )
}
