import React from 'react'
import { SheetOverlay } from './SheetOverlay'
import { SettingsPage } from '../pages/SettingsPage'
import { useSettingsSheet } from '../contexts/SettingsSheetContext'

export function SettingsSheetRenderer() {
  const { sheet, closeSettingsSheet, onGoToStorybook } = useSettingsSheet()

  return (
    <SheetOverlay isOpen={sheet.isOpen} onClose={closeSettingsSheet}>
      <SettingsPage
        onClose={closeSettingsSheet}
        onGoToStorybook={onGoToStorybook}
      />
    </SheetOverlay>
  )
}
