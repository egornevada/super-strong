import React from 'react';
import logoSvg from '../../assets/icons/Logo.svg';
import { Loader } from '../loaders/Loader';
import { LoadingScreenSkeleton } from './LoadingScreenSkeleton';
import './LoadingScreen.css';

interface LoadingScreenProps {
  progress: number; // 0-100
  currentStep: string; // "Загружаем пользователя", "Загружаем упражнения", etc.
  totalWeight?: number;
  totalDays?: number;
}

/**
 * Full-screen loading screen shown during app initialization
 * Displays:
 * - Header with logo (mirroring main header)
 * - Calendar skeleton
 * - Stats block with progress and current step
 */
export function LoadingScreen({ progress, currentStep, totalWeight = 0, totalDays = 0 }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      {/* Header - mirroring main app header */}
      <div className="loading-header">
        <div className="loading-header-content">
          {/* ЛОГОТИП 106x44 */}
          <img
            src={logoSvg}
            alt="Logo"
            className="loading-logo"
          />
        </div>

        {/* ЛОАДЕР ПЕРЕКРЫВАЕТ ЛОГОТИП (абсолютная позиция, right -1px, 46x46) */}
        <div className="loading-logo-container">
          <Loader size="md" />
        </div>
      </div>

      {/* Calendar skeleton with stats overlay */}
      <div className="loading-skeleton-container">
        <LoadingScreenSkeleton />

        {/* Stats block (like statistics at bottom of calendar) */}
        <div className="loading-stats">
          {/* Title with percentage - like "Статистика за месяц" in Calendar */}
          <h3 className="text-fg-1 mb-3 text-heading-md">Загружаемся... {progress}%</h3>

          {/* Current step description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-fg-3">{currentStep}</span>
            </div>

            {/* Stats info - like DefaultStroke rows in CalendarPage */}
            {totalWeight > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-fg-3">Поднялось</span>
                <span className="text-fg-1 font-medium">{totalWeight} кг</span>
              </div>
            )}
            {totalDays > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-fg-3">Тренировались дней</span>
                <span className="text-fg-1 font-medium">{totalDays}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
