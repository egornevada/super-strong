import React from 'react'
import { SheetOverlay } from '../components/modals/SheetOverlay'
import { ExerciseDetailPage } from './ExerciseDetailPage'
import { useExerciseDetailSheet } from '../contexts/SheetContext'

export function ExerciseDetailSheetRenderer() {
  const { sheet, closeSheet } = useExerciseDetailSheet()

  return (
    <SheetOverlay isOpen={sheet.isOpen} onClose={closeSheet}>
      <ExerciseDetailPage
        exerciseId={sheet.exerciseId || ''}
        onClose={closeSheet}
      />
    </SheetOverlay>
  )
}
