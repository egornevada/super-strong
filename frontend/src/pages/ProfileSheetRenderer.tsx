import React from 'react'
import { SheetOverlay } from '../components/modals/SheetOverlay'
import { ProfilePage } from './ProfilePage'
import { useProfileSheet } from '../contexts/ProfileSheetContext'

export function ProfileSheetRenderer() {
  const { sheet, closeProfileSheet } = useProfileSheet()

  return (
    <SheetOverlay isOpen={sheet.isOpen} onClose={closeProfileSheet}>
      <ProfilePage onClose={closeProfileSheet} />
    </SheetOverlay>
  )
}