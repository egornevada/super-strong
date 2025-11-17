import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { PrimaryPageName } from '../navigation/navigation'

export interface PageCacheEntry {
  state: any
  scrollPosition: number
  timestamp: number
}

interface PageCacheContextType {
  pages: Record<PrimaryPageName, PageCacheEntry>
  savePageState: (pageName: PrimaryPageName, state: any, scrollPosition: number) => void
  getPageState: (pageName: PrimaryPageName) => PageCacheEntry | undefined
  clearPageCache: (pageName: PrimaryPageName) => void
  clearAllCache: () => void
}

const PageCacheContext = createContext<PageCacheContextType | null>(null)

const STORAGE_KEY = 'super-strong-page-cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export function PageCacheProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Record<PrimaryPageName, PageCacheEntry>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return {} as Record<PrimaryPageName, PageCacheEntry>

      const parsed: unknown = JSON.parse(stored)
      const now = Date.now()

      // Удаляем устаревший кэш
      const filtered: Partial<Record<PrimaryPageName, PageCacheEntry>> = {}
      if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([key, entry]) => {
          if (typeof entry === 'object' && entry !== null && 'timestamp' in entry) {
            const cacheEntry = entry as PageCacheEntry
            if (cacheEntry.timestamp && now - cacheEntry.timestamp < CACHE_DURATION) {
              filtered[key as PrimaryPageName] = cacheEntry
            }
          }
        })
      }

      return filtered as Record<PrimaryPageName, PageCacheEntry>
    } catch {
      return {} as Record<PrimaryPageName, PageCacheEntry>
    }
  })

  // Сохраняем в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
    } catch {
      console.warn('Failed to save page cache to localStorage')
    }
  }, [pages])

  const savePageState = (
    pageName: PrimaryPageName,
    state: any,
    scrollPosition: number = 0
  ) => {
    setPages((prev) => ({
      ...prev,
      [pageName]: {
        state,
        scrollPosition,
        timestamp: Date.now(),
      },
    }))
  }

  const getPageState = (pageName: PrimaryPageName) => {
    return pages[pageName]
  }

  const clearPageCache = (pageName: PrimaryPageName) => {
    setPages((prev) => {
      const next = { ...prev }
      delete next[pageName]
      return next
    })
  }

  const clearAllCache = () => {
    setPages({} as Record<PrimaryPageName, PageCacheEntry>)
  }

  return (
    <PageCacheContext.Provider
      value={{ pages, savePageState, getPageState, clearPageCache, clearAllCache }}
    >
      {children}
    </PageCacheContext.Provider>
  )
}

export function usePageCache() {
  const context = useContext(PageCacheContext)
  if (!context) {
    throw new Error('usePageCache must be used within PageCacheProvider')
  }
  return context
}
