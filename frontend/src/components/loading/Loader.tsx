import React from 'react';
import './Loader.css';

export interface LoaderProps {
  size?: 'S' | 'M' | 'L';
  className?: string;
}

/**
 * Two-arc rotating loader component
 * Shows rotating arcs with fg-disabled and fg-brand colors
 * Used in header during save/loading operations
 */
export function Loader({ size = 'M', className = '' }: LoaderProps) {
  const sizeMap = {
    S: 24,
    M: 46,
    L: 64,
  };

  const dimensions = sizeMap[size];
  const radius = dimensions / 2 - 4; // Inner radius for the arcs
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.6; // 60% of circle for each arc

  return (
    <div className={`loader-container ${className}`} style={{ width: dimensions, height: dimensions }}>
      <svg
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        className="loader-svg"
      >
        {/* Brand arc (blue) */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke="var(--fg-brand)"
          strokeWidth="5"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          className="loader-arc-active"
        />
      </svg>
    </div>
  );
}

/**
 * Inline loader variant that displays text next to the spinning logo
 */
export function InlineLoader({ text = 'Сохраняется...', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`inline-loader flex items-center gap-2 ${className}`}>
      <Loader size="S" />
      <span className="text-fg-2 text-sm">{text}</span>
    </div>
  );
}
