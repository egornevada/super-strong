import React from 'react';
import { Loader } from './Loader';

export interface HeaderLoaderProps {
  isLoading: boolean;
  text?: string;
}

/**
 * Header-specific loader component
 * Displays a spinning logo loader in the header during save operations
 * Only visible when isLoading is true
 */
export function HeaderLoader({ isLoading, text = 'Сохранение...' }: HeaderLoaderProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-brand/10 rounded-md">
      <Loader size="S" />
      <span className="text-fg-brand text-xs font-medium">{text}</span>
    </div>
  );
}
