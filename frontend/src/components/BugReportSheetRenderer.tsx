import React from 'react';
import { SheetOverlay } from './SheetOverlay';
import { BugReportPage } from '../pages/BugReportPage';
import { useBugReportSheet } from '../contexts/BugReportSheetContext';

export function BugReportSheetRenderer() {
  const { sheet, closeBugReportSheet, onBugReportSubmitted } = useBugReportSheet();

  const handleReportSubmitted = () => {
    // Закрываем шит сначала
    closeBugReportSheet();

    // Затем показываем snackbar через callback
    if (onBugReportSubmitted) {
      onBugReportSubmitted(() => {
        // Callback будет выполнен в App
      });
    }
  };

  return (
    <SheetOverlay isOpen={sheet.isOpen} onClose={closeBugReportSheet}>
      <BugReportPage
        isOpen={sheet.isOpen}
        onClose={closeBugReportSheet}
        onReportSubmitted={handleReportSubmitted}
      />
    </SheetOverlay>
  );
}
