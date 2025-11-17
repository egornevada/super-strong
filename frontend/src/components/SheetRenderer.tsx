import React from 'react'
import { SheetOverlay } from './SheetOverlay'
import { ExerciseDetailPage } from '../pages/ExerciseDetailPage'
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
