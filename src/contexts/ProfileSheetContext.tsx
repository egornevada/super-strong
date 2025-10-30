import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface ProfileSheetState {
  isOpen: boolean
}

interface ProfileSheetContextType {
  sheet: ProfileSheetState
  openProfileSheet: () => void
  closeProfileSheet: () => void
}

const ProfileSheetContext = createContext<ProfileSheetContextType | null>(null)

export function ProfileSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<ProfileSheetState>({
    isOpen: false,
  })

  const openProfileSheet = () => {
    setSheet({
      isOpen: true,
    })
  }

  const closeProfileSheet = () => {
    setSheet({
      isOpen: false,
    })
  }

  return (
    <ProfileSheetContext.Provider value={{ sheet, openProfileSheet, closeProfileSheet }}>
      {children}
    </ProfileSheetContext.Provider>
  )
}

export function useProfileSheet() {
  const context = useContext(ProfileSheetContext)
  if (!context) {
    throw new Error('useProfileSheet must be used within ProfileSheetProvider')
  }
  return context
}
