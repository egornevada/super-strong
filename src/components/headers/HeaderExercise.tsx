import * as React from 'react';
import { useEffect } from 'react';
import { Button } from '../main/Button';
import { Loader } from '../loaders/Loader';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import logoTextSvg from '../../assets/icons/Logo Only text.svg';
import logoSvg from '../../assets/icons/Logo.svg';
import logoErrorSvg from '../../assets/icons/Logo Error.svg';

export interface HeaderWithBackButtonProps {
  backButtonLabel: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  isLoading?: boolean;
  onOpenBugReport?: () => void;
}

export const HeaderWithBackButton = React.forwardRef<HTMLDivElement, HeaderWithBackButtonProps>(
  ({ backButtonLabel, onBack, rightSlot, isLoading = false, onOpenBugReport }, ref) => {
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
          {/* Logo with overlay loader */}
          <div
            ref={logoContainerRef}
            className="relative cursor-pointer"
            style={{ width: '106px', height: '44px' }}
            onClick={handleLogoClick}
          >
            {/* Logo - always visible */}
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
                  transform: 'translateY(-50%)',
                  width: '46px',
                  height: '46px'
                }}
              >
                <Loader size="md" />
              </div>
            )}
          </div>

          {/* Right side: back button and optional slots */}
          <div className="flex items-center gap-3">

            <Button
              priority="secondary"
              tone="default"
              size="md"
              onClick={onBack}
              aria-label="Select date"
              style={{
                width: '124px',
              }}
              leftIcon={<EventRoundedIcon />}
            >
              {backButtonLabel}
            </Button>

            {/* Additional right slot (buttons) */}
            {rightSlot && (
              <div className="flex items-center gap-3">
                {rightSlot}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

HeaderWithBackButton.displayName = 'HeaderWithBackButton';
