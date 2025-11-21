import React, { useState } from 'react';
import { Button } from '../main/Button';
import { TextField } from '../TextField';
import { logger } from '../../lib/logger';

export interface UsernameModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string;
  onConfirm: (username: string) => Promise<void> | void;
}

export function UsernameModal({
  isOpen,
  isLoading = false,
  error,
  onConfirm
}: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [localError, setLocalError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!username.trim()) {
      setLocalError('Пожалуйста, введите никнейм');
      return;
    }

    if (username.length < 3) {
      setLocalError('Никнейм должен быть минимум 3 символа');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setLocalError('Никнейм может содержать только буквы, цифры, подчеркивание и дефис');
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError('');
      await onConfirm(username);
      setUsername('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка подключения';
      setLocalError(errorMessage);
      logger.error('Error confirming username', err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const effectiveError = error || localError;
  const effectiveIsLoading = isLoading || isSubmitting;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-bg-1 shadow-card w-[90%] max-w-sm" style={{ borderRadius: '20px' }}>
        {/* Text container */}
        <div style={{ padding: '16px', paddingBottom: 0 }}>
          <h2 className="text-fg-1 text-xl font-semibold" style={{ margin: 0, marginBottom: '8px' }}>Подключитесь к аккаунту</h2>
          <p className="text-fg-2 text-sm" style={{ margin: 0 }}>
            Введите ваш никнейм для подключения к существующему аккаунту или создания нового
          </p>
        </div>

        {/* Content container */}
        <div style={{ padding: '16px' }}>
          {/* Username Input */}
          <TextField
            label="Никнейм"
            value={username}
            onChange={(value) => {
              setUsername(value);
              setLocalError('');
            }}
            disabled={effectiveIsLoading}
          />

          {/* Error Message */}
          {effectiveError && (
            <div className="bg-bg-3 border border-fg-3 rounded-xl p-3" style={{ marginTop: '12px' }}>
              <p className="text-fg-1 text-sm">{effectiveError}</p>
            </div>
          )}

          {/* Loading Message */}
          {effectiveIsLoading && (
            <div style={{ marginTop: '12px' }}>
              <p className="text-fg-2 text-sm">Подключение...</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            priority="primary"
            tone="default"
            size="md"
            className="w-full"
            onClick={handleSubmit}
            disabled={effectiveIsLoading}
            style={{ marginTop: '12px' }}
          >
            {effectiveIsLoading ? 'Подключение...' : 'Подключить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
