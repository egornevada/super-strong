import { useEffect, useState } from 'react';

export interface SnackbarProps {
  message: string;
  isVisible: boolean;
  duration?: number; // в миллисекундах, по умолчанию 500ms
  variant?: 'brand' | 'inverted'; // вариант оформления
}

export const Snackbar = ({ message, isVisible, duration = 500, variant = 'brand' }: SnackbarProps) => {
  const [display, setDisplay] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setDisplay(true);
      setIsClosing(false);
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setDisplay(false);
        }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!display) return null;

  const bgClass = variant === 'inverted' ? 'bg-bg-inverted text-fg-inverted' : 'bg-bg-brand text-fg-inverted';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '0',
        right: '0',
        margin: '0 auto',
        width: 'fit-content',
        zIndex: 50,
        animation: isClosing ? 'fadeOutDown 0.3s ease-in forwards' : 'fadeInUp 0.3s ease-out forwards',
      }}
    >
      <div className={`${bgClass} px-6 py-3 rounded-lg shadow-lg whitespace-nowrap`}>
        {message}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }
      `}</style>
    </div>
  );
};
