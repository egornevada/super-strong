/* @refresh reset */
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BugReportSheetState {
  isOpen: boolean;
  currentPage?: string;
}

interface BugReportSheetContextType {
  sheet: BugReportSheetState;
  openBugReportSheet: (pageName?: string) => void;
  closeBugReportSheet: () => void;
  onBugReportSubmitted: ((callback: () => void) => void) | null;
  setOnBugReportSubmitted: (callback: ((callback: () => void) => void) | null) => void;
}

const BugReportSheetContext = createContext<BugReportSheetContextType | null>(null);

export function BugReportSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<BugReportSheetState>({
    isOpen: false,
  });
  const [onBugReportSubmitted, setOnBugReportSubmitted] = useState<((callback: () => void) => void) | null>(null);

  const openBugReportSheet = (pageName?: string) => {
    setSheet({
      isOpen: true,
      currentPage: pageName,
    });
  };

  const closeBugReportSheet = () => {
    setSheet({
      isOpen: false,
    });
  };

  return (
    <BugReportSheetContext.Provider value={{ sheet, openBugReportSheet, closeBugReportSheet, onBugReportSubmitted, setOnBugReportSubmitted }}>
      {children}
    </BugReportSheetContext.Provider>
  );
}

export function useBugReportSheet() {
  const context = useContext(BugReportSheetContext);
  if (!context) {
    throw new Error('useBugReportSheet must be used within BugReportSheetProvider');
  }
  return context;
}
