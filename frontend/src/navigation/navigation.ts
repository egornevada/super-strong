import React from 'react'
import type { CalendarPage } from '../pages/CalendarPage'
import type { ExercisesPage } from '../pages/ExercisesPage'
import type { MyExercisesPage } from '../pages/MyExercisesPage'

export type PrimaryPageName = 'calendar' | 'exercises' | 'tracking' | 'profile' | 'settings'
export type SheetPageName = 'exercise-detail'
export type PageName = PrimaryPageName | SheetPageName

export interface PageConfig {
  title: string
  showInTabs?: boolean
}

export const navigationConfig: Record<PageName, PageConfig> = {
  // Primary pages - fullscreen, cached, dissolve animation between them
  calendar: {
    title: 'Календарь',
    showInTabs: true
  },
  exercises: {
    title: 'Каталог упражнений',
    showInTabs: true
  },
  tracking: {
    title: 'Трекинг',
    showInTabs: true
  },
  profile: {
    title: 'Профиль',
    showInTabs: false
  },
  settings: {
    title: 'Настройки',
    showInTabs: false
  },

  // Sheet pages - slide-up modals, no caching
  'exercise-detail': {
    title: 'Упражнение',
    showInTabs: false
  },
}

export const PRIMARY_PAGES: PrimaryPageName[] = ['calendar', 'exercises', 'tracking', 'profile', 'settings']
export const SHEET_PAGES: SheetPageName[] = ['exercise-detail']
