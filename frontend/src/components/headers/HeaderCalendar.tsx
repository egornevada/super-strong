import * as React from 'react';
import { Loader } from '../loading/Loader';
import logoSvg from '../../assets/icons/Logo.svg';

export interface HeaderProps {
  logoSrc?: string;
  title?: string;
  rightSlot?: React.ReactNode;
  isLoading?: boolean;
}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ logoSrc = logoSvg, title, rightSlot, isLoading = false }, ref) => {

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
            /* Logo with overlay loader */
            <div
              className="relative"
              style={{ width: '106px', height: '44px' }}
            >
              {/* Logo - always visible */}
              <img
                src={logoSrc}
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
                  <Loader size="M" />
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
