import React from 'react'
import { SheetOverlay } from '../components/modals/SheetOverlay'
import { SettingsPage } from './SettingsPage'
import { useSettingsSheet } from '../contexts/SettingsSheetContext'

export function SettingsSheetRenderer() {
  const { sheet, closeSettingsSheet } = useSettingsSheet()

  return (
    <SheetOverlay isOpen={sheet.isOpen} onClose={closeSettingsSheet}>
      <SettingsPage
        onClose={closeSettingsSheet}
      />
    </SheetOverlay>
  )
}
