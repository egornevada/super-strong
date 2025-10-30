import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface SettingsSheetState {
  isOpen: boolean
}

interface SettingsSheetContextType {
  sheet: SettingsSheetState
  openSettingsSheet: () => void
  closeSettingsSheet: () => void
}

const SettingsSheetContext = createContext<SettingsSheetContextType | null>(null)

export function SettingsSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SettingsSheetState>({
    isOpen: false,
  })

  const openSettingsSheet = () => {
    setSheet({
      isOpen: true,
    })
  }

  const closeSettingsSheet = () => {
    setSheet({
      isOpen: false,
    })
  }

  return (
    <SettingsSheetContext.Provider value={{ sheet, openSettingsSheet, closeSettingsSheet }}>
      {children}
    </SettingsSheetContext.Provider>
  )
}

export function useSettingsSheet() {
  const context = useContext(SettingsSheetContext)
  if (!context) {
    throw new Error('useSettingsSheet must be used within SettingsSheetProvider')
  }
  return context
}
