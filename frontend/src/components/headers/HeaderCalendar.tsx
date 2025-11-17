import * as React from 'react';
import { useEffect } from 'react';
import { Loader } from '../loaders/Loader';
import logoSvg from '../../assets/icons/Logo.svg';
import logoErrorSvg from '../../assets/icons/Logo Error.svg';

export interface HeaderProps {
  logoSrc?: string;
  title?: string;
  rightSlot?: React.ReactNode;
  isLoading?: boolean;
  onOpenBugReport?: () => void;
}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ logoSrc = logoSvg, title, rightSlot, isLoading = false, onOpenBugReport }, ref) => {
    const [isErrorLogoActive, setIsErrorLogoActive] = React.useState(false);
    const logoContainerRef = React.useRef<HTMLDivElement>(null);

    // Handle clicks outside logo to reset state
    useEffect(() => {
      const handleDocumentClick = (event: MouseEvent) => {
        if (logoContainerRef.current && !logoContainerRef.current.contains(event.target as Node)) {
          setIsErrorLogoActive(false);
        }
      };

      if (isErrorLogoActive) {
        document.addEventListener('click', handleDocumentClick);
        return () => {
          document.removeEventListener('click', handleDocumentClick);
        };
      }
    }, [isErrorLogoActive]);

    const handleLogoClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isErrorLogoActive) {
        // First click: activate error logo
        setIsErrorLogoActive(true);
      } else {
        // Second click: open bug report
        setIsErrorLogoActive(false);
        onOpenBugReport?.();
      }
    };

    const currentLogoSrc = isErrorLogoActive ? logoErrorSvg : logoSvg;

    return (
      <div
        ref={ref}
        className="sticky top-0 bg-bg-1 z-10 w-full"
        style={{ height: '72px', paddingLeft: '12px', paddingRight: '12px' }}
      >
        <div className="h-full flex items-center justify-between">
          {/* Logo or Title */}
          {title ? (
            <h1
              className="text-fg-1 flex-1"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '20px',
                fontWeight: 500,
                lineHeight: '24px',
                letterSpacing: '-3%',
                margin: 0
              }}
            >
              {title}
            </h1>
          ) : (
            /* Logo with overlay loader and click handler */
            <div
              ref={logoContainerRef}
              className="relative cursor-pointer"
              style={{ width: '106px', height: '44px' }}
              onClick={handleLogoClick}
            >
              {/* Logo text - always visible */}
              <img
                src={currentLogoSrc}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

              {/* Loader overlay - shows during loading, positioned left */}
              {isLoading && (
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    transition: 'opacity 0.2s',
                    left: '-1px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <Loader size="md" />
                </div>
              )}
            </div>
          )}

          {/* Right slot (buttons) */}
          {rightSlot && (
            <div className="flex items-center gap-3">
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Header.displayName = 'Header';
