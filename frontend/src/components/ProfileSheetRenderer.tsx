import React from 'react'
import { SheetOverlay } from './SheetOverlay'
import { ProfilePage } from '../pages/ProfilePage'
import { useProfileSheet } from '../contexts/ProfileSheetContext'

export function ProfileSheetRenderer() {
  const { sheet, closeProfileSheet } = useProfileSheet()

  return (
    <SheetOverlay isOpen={sheet.isOpen} onClose={closeProfileSheet}>
      <ProfilePage onClose={closeProfileSheet} />
    </SheetOverlay>
  )
}