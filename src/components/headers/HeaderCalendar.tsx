import * as React from 'react';
import logoSvg from '../../assets/icons/Logo.svg';

export interface HeaderProps {
  logoSrc?: string;
  rightSlot?: React.ReactNode;
}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ logoSrc = logoSvg, rightSlot }, ref) => {
    return (
      <div
        ref={ref}
        className="sticky top-0 bg-bg-1 z-10 w-full"
        style={{ height: '72px', paddingLeft: '12px', paddingRight: '12px' }}
      >
        <div className="h-full flex items-center justify-between">
          {/* Logo - 106x44px */}
          <img
            src={logoSrc}
            alt="Logo"
            style={{ width: '106px', height: '44px', objectFit: 'contain' }}
          />

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
