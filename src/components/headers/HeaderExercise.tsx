import * as React from 'react';
import { Button } from '../main/Button';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import logoSvg from '../../assets/icons/Logo.svg';

export interface HeaderWithBackButtonProps {
  backButtonLabel: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export const HeaderWithBackButton = React.forwardRef<HTMLDivElement, HeaderWithBackButtonProps>(
  ({ backButtonLabel, onBack, rightSlot }, ref) => {
    return (
      <div
        ref={ref}
        className="sticky top-0 bg-bg-1 z-10 w-full"
        style={{ height: '72px', paddingLeft: '12px', paddingRight: '12px' }}
      >
        <div className="h-full flex items-center justify-between">
          {/* Logo - 106x44px */}
          <img
            src={logoSvg}
            alt="Logo"
            style={{ width: '106px', height: '44px', objectFit: 'contain' }}
          />

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
