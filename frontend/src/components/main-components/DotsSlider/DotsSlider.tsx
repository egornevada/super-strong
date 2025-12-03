import React, { useState, useRef, useEffect } from 'react';
import { Step } from '../../../services/directusApi';
import './DotsSlider.css';

export interface DotsSliderProps {
  steps: Step[];
  exerciseName?: string;
}

export function DotsSlider({ steps, exerciseName = 'Упражнение' }: DotsSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Обработка свайпа
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const diff = touchStartX.current - touchEndX.current;
    const isLeftSwipe = diff > 50; // Порог 50px
    const isRightSwipe = diff < -50;

    if (isLeftSwipe && currentSlide < steps.length - 1) {
      setDirection('next');
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setDirection('prev');
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Навигация по точкам
  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 'next' : 'prev');
    setCurrentSlide(index);
  };

  // Клавиатурная навигация
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight' && currentSlide < steps.length - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, steps.length]);

  if (!steps || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentSlide];

  return (
    <div className="steps-slider">
      {/* Слайдер с изображением */}
      <div
        className="steps-slider-container"
        ref={sliderRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentStep.image && (
          <div className={`steps-slider-image-wrapper slide-${direction}`} key={`image-${currentSlide}`}>
            <img
              src={currentStep.image.url}
              alt={currentStep.image.alternativeText || currentStep.title}
              className="steps-slider-image"
            />
          </div>
        )}
      </div>

      {/* Информация о шаге */}
      <div className={`steps-slider-content slide-${direction}`} key={`content-${currentSlide}`}>
        {currentStep.title && (
          <h3 className="steps-slider-title">{currentStep.title}</h3>
        )}

        {currentStep.description && (
          <p className="steps-slider-description">{currentStep.description}</p>
        )}
      </div>

      {/* Точки навигации */}
      {steps.length > 1 && (
        <div className="steps-slider-dots">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`steps-slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
