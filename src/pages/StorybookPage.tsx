import { Header } from '../components/headers/HeaderCalendar';
import { HeaderWithBackButton } from '../components/headers/HeaderExercise';
import { PageLayout } from '../components/PageLayout';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Button } from '../components/main/Button';

interface StorybookPageProps {
  onBack?: () => void;
}

export function StorybookPage({ onBack }: StorybookPageProps) {

  return (
    <div className="w-full h-full bg-bg-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-bg-1 z-20 border-b border-stroke-1 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📖 Storybook</h1>
            <p className="text-fg-2 text-sm mt-1">All Components</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-bg-2 hover:bg-bg-3 rounded-lg transition-colors text-fg-1 font-medium"
            >
              ← Вернуться
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <section className="space-y-12">
          {/* HEADERS */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Headers</h2>

            {/* Header (without back button) */}
            <div className="mb-8">
              <p className="text-fg-2 text-sm mb-4">Header with Logo and Right Buttons</p>
              <div className="border border-stroke-1 rounded-lg overflow-hidden">
                <Header
                  rightSlot={
                    <>
                      <Button
                        priority="secondary"
                        tone="default"
                        size="md"
                        leftIcon={<AccountCircleRoundedIcon />}
                        aria-label="Profile"
                        iconOnly
                      />
                      <Button
                        priority="secondary"
                        tone="default"
                        size="md"
                        leftIcon={<SettingsRoundedIcon />}
                        aria-label="Settings"
                        iconOnly
                      />
                    </>
                  }
                />
              </div>
            </div>

            {/* HeaderWithBackButton */}
            <div className="mb-8">
              <p className="text-fg-2 text-sm mb-4">Header with Back Button</p>
              <div className="border border-stroke-1 rounded-lg overflow-hidden">
                <HeaderWithBackButton
                  backButtonLabel="14 сент."
                  onBack={() => alert('Back button clicked!')}
                />
              </div>
            </div>
          </div>

          {/* PAGE LAYOUT (Popup Header) */}
          <div>
            <h2 className="text-2xl font-bold mb-8">PageLayout (Popup Header)</h2>

            {/* PageLayout */}
            <div className="mb-8">
              <p className="text-fg-2 text-sm mb-4">Popup Page Header with Close Button</p>
              <div className="border border-stroke-1 rounded-lg overflow-hidden h-64">
                <PageLayout
                  title="Настройки"
                  onClose={() => alert('Close button clicked!')}
                >
                  <p className="text-fg-2">Popup content goes here</p>
                </PageLayout>
              </div>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
