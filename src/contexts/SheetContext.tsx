import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface ExerciseDetailSheetState {
  isOpen: boolean
  exerciseId?: string
}

interface ExerciseDetailSheetContextType {
  sheet: ExerciseDetailSheetState
  openExerciseDetail: (exerciseId: string) => void
  closeSheet: () => void
}

const ExerciseDetailSheetContext = createContext<ExerciseDetailSheetContextType | null>(null)

export function ExerciseDetailSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<ExerciseDetailSheetState>({
    isOpen: false,
  })

  const openExerciseDetail = (exerciseId: string) => {
    setSheet({
      isOpen: true,
      exerciseId,
    })
  }

  const closeSheet = () => {
    setSheet({
      isOpen: false,
      exerciseId: undefined,
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
