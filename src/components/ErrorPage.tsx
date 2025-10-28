export interface ErrorPageProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ErrorPage({
  title = 'Ошибка подключения',
  message = 'Не удается подключиться к серверу. Проверьте подключение к интернету и попробуйте позже.',
  onBack,
  showBackButton = false
}: ErrorPageProps) {
  return (
    <div className="w-full h-full bg-bg-1 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-fg-1 mb-3">{title}</h1>
        <p className="text-fg-2 text-sm leading-relaxed mb-6">{message}</p>

        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2 bg-bg-brand text-fg-inverted rounded-lg font-medium text-sm hover:opacity-90 transition-opacity active:scale-95"
          >
            Вернуться
          </button>
        )}
      </div>
    </div>
  );
}
