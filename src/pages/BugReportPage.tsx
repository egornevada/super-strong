import { useState, useEffect } from 'react';
import { DefaultStroke, Button } from '../components';
import { getBrowserInfo } from '../lib/browser';
import { createBugReport } from '../services/supabaseApi';
import { getUserSession } from '../services/authApi';
import { logger } from '../lib/logger';
import { useBugReportSheet } from '../contexts/BugReportSheetContext';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface BugReportPageProps {
  onClose?: () => void;
  onReportSubmitted?: () => void;
  isOpen?: boolean;
}

export function BugReportPage({ onClose, onReportSubmitted, isOpen }: BugReportPageProps) {
  const { sheet } = useBugReportSheet();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixedTime, setFixedTime] = useState('');

  const browserInfo = getBrowserInfo();
  const currentPage = sheet.currentPage || 'Неизвестно';

  // Зафиксировать время и очистить форму при открытии шита
  useEffect(() => {
    const time = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setFixedTime(time);
    setMessage('');
    setError(null);
  }, [isOpen]);

  const handleSubmitReport = async () => {
    if (!message.trim()) {
      setError('Пожалуйста, опишите проблему');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const session = getUserSession();
      const username = session?.username || 'anonymous';

      await createBugReport({
        telegram_username: username,
        browser_info: browserInfo,
        message: message.trim(),
        page: currentPage,
      });

      logger.info('Bug report submitted successfully', {
        username,
        browserInfo,
      });

      // Вызываем callback успеха (снекбар + закрытие)
      onReportSubmitted?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при отправке отчета';
      setError(errorMessage);
      logger.error('Failed to submit bug report', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-fg-1 font-normal text-lg">Отправить отчет о баге</h1>
        <Button
          priority="secondary"
          tone="default"
          size="md"
          leftIcon={<CloseRoundedIcon />}
          aria-label="Close"
          iconOnly
          onClick={onClose}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Info section */}
        <div className="space-y-0 mb-6">
          <div className="py-4 border-b border-stroke-1">
            <DefaultStroke label="Время" value={fixedTime} />
          </div>
          <div className="py-4 border-b border-stroke-1">
            <DefaultStroke label="Страница" value={currentPage} />
          </div>
          <div className="py-4 border-b border-stroke-1">
            <DefaultStroke label="Браузер" value={browserInfo} />
          </div>
        </div>

        {/* Message section */}
        <div className="flex flex-col">
          <label className="text-fg-1 font-semibold mb-3">Описание проблемы</label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            placeholder="Опишите, какую проблему вы обнаружили..."
            className="px-4 py-3 bg-bg-2 text-fg-1 border border-stroke-1 rounded-lg resize-none focus:outline-none focus:border-stroke-controls"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '1.5',
              minHeight: '108px',
            }}
          />

          {/* Error message */}
          {error && <p className="text-fg-error text-sm mt-2">{error}</p>}
        </div>
      </div>

      {/* Button section */}
      <div className="px-4 py-4 border-t border-stroke-1">
        <Button
          priority="primary"
          tone="brand"
          size="md"
          className="w-full"
          onClick={handleSubmitReport}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? 'Отправляем...' : 'Отправить отчет'}
        </Button>
      </div>
    </div>
  );
}
