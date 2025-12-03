import React from 'react';
import './ExercisesPageSkeleton.css';

/**
 * Skeleton loader для ExercisesPage
 * Показывает структуру страницы с пулсирующими элементами
 */
export function ExercisesPageSkeleton() {
  return (
    <div className="exercises-skeleton">
      {/* Filter pills skeleton */}
      <div className="skeleton-filters">
        <div className="skeleton-filter-pill" />
        <div className="skeleton-filter-pill" />
        <div className="skeleton-filter-pill" />
        <div className="skeleton-filter-pill" />
        <div className="skeleton-filter-pill" />
        <div className="skeleton-filter-pill" />
      </div>

      {/* Categories with exercises skeleton */}
      {[...Array(5)].map((_, categoryIdx) => (
        <div key={categoryIdx} className="skeleton-category">
          {/* Category title */}
          <div className="skeleton-category-title" />

          {/* Exercise cards grid */}
          <div className="skeleton-cards-grid">
            {[...Array(6)].map((_, cardIdx) => (
              <div key={cardIdx} className="skeleton-card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
