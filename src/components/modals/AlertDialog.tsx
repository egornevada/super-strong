import * as React from 'react';
import { Button } from '../main/Button';

export interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDangerous?: boolean;
}

export const AlertDialog = React.forwardRef<HTMLDivElement, AlertDialogProps>(
  ({
    isOpen,
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отменить',
    onConfirm,
    onCancel,
    isDangerous = false
  }, ref) => {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        {/* Dialog content - centered modal */}
        <div className="w-full bg-bg-1 max-w-[320px] rounded-2xl p-6">
          {/* Title */}
          <h2
            className="text-fg-1 mb-2"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              lineHeight: '24px',
              letterSpacing: '-2%',
              margin: 0,
              marginBottom: '8px'
            }}
          >
            {title}
          </h2>

          {/* Message */}
          <p
            className="text-fg-2 mb-6"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '-2%',
              margin: 0,
              marginBottom: '24px'
            }}
          >
            {message}
          </p>

          {/* Buttons - stack vertically */}
          <div className="flex flex-col gap-3" style={{ gap: '12px' }}>
            <Button
              priority="secondary"
              tone="default"
              size="md"
              className="w-full"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
            <Button
              priority="primary"
              tone={isDangerous ? 'error' : 'brand'}
              size="md"
              className="w-full"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

AlertDialog.displayName = 'AlertDialog';
