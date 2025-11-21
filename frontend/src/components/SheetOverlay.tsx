import React, { useEffect, useState } from 'react'

interface SheetOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function SheetOverlay({ isOpen, onClose, children }: SheetOverlayProps) {
  const [topOffset, setTopOffset] = useState(24)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 640) {
        setTopOffset(48)
      } else {
        setTopOffset(24)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
        className="fixed inset-0 bg-transparent z-40"
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

      {/* Sheet container - выезжает снизу, оставляя отступ сверху */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          opacity: isOpen ? 1 : 0,
          height: '100dvh',
          top: '0px',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: isOpen
            ? 'transform 200ms ease-out, opacity 200ms ease-out, visibility 200ms ease-out'
            : 'transform 200ms ease-in, opacity 200ms ease-in, visibility 200ms ease-in 200ms',
        }}
      >
        {/* Sheet content без rounded corners */}
        <div className="bg-bg-1 overflow-hidden flex flex-col h-full" style={{ maxWidth: '632px', width: '100%' }}>
          {children}
        </div>
      </div>
    </>
  )
}
