import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface ExerciseDetailSheetState {
  isOpen: boolean
  exerciseId?: string
  onDeleteExercise?: () => void
  onAddExercise?: () => void
  onRemoveExercise?: () => void
  isExerciseAdded?: boolean
}

interface ExerciseDetailSheetContextType {
  sheet: ExerciseDetailSheetState
  openExerciseDetail: (exerciseId: string, onDeleteExercise?: () => void, onAddExercise?: () => void, onRemoveExercise?: () => void, isExerciseAdded?: boolean) => void
  closeSheet: () => void
}

const ExerciseDetailSheetContext = createContext<ExerciseDetailSheetContextType | null>(null)

export function ExerciseDetailSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<ExerciseDetailSheetState>({
    isOpen: false,
  })

  const openExerciseDetail = (exerciseId: string, onDeleteExercise?: () => void, onAddExercise?: () => void, onRemoveExercise?: () => void, isExerciseAdded?: boolean) => {
    setSheet({
      isOpen: true,
      exerciseId,
      onDeleteExercise,
      onAddExercise,
      onRemoveExercise,
      isExerciseAdded,
    })
  }

  const closeSheet = () => {
    setSheet({
      isOpen: false,
      exerciseId: undefined,
      onDeleteExercise: undefined,
      onAddExercise: undefined,
      onRemoveExercise: undefined,
      isExerciseAdded: undefined,
    })
  }

  return (
    <ExerciseDetailSheetContext.Provider value={{ sheet, openExerciseDetail, closeSheet }}>
      {children}
    </ExerciseDetailSheetContext.Provider>
  )
}

export function useExerciseDetailSheet() {
  const context = useContext(ExerciseDetailSheetContext)
  if (!context) {
    throw new Error('useExerciseDetailSheet must be used within ExerciseDetailSheetProvider')
  }
  return context
}
