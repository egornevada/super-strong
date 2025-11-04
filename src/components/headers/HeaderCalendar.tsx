import * as React from 'react';
import logoSvg from '../../assets/icons/Logo.svg';

export interface HeaderProps {
  logoSrc?: string;
  title?: string;
  rightSlot?: React.ReactNode;
}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ logoSrc = logoSvg, title, rightSlot }, ref) => {
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
            <img
              src={logoSrc}
              alt="Logo"
              style={{ width: '106px', height: '44px', objectFit: 'contain' }}
            />
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
