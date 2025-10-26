import { useState } from 'react';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Button, FilterPill, ExerciseCard } from '../components';

const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    heart: <FavoriteBorderRoundedIcon />,
    check: <CheckCircleRoundedIcon />,
    star: <StarRoundedIcon />,
    settings: <SettingsRoundedIcon />,
  };
  return icons[name] || null;
};

export function StorybookPage() {
  const [selectedPills, setSelectedPills] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const togglePill = (label: string) => {
    setSelectedPills((prev) =>
      prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]
    );
  };

  const toggleExercise = (id: string) => {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((ex) => ex !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-bg-1 text-fg-1">
      {/* Header */}
      <div className="sticky top-0 bg-bg-1 z-20 border-b border-stroke-1 px-6 py-4">
        <h1 className="text-3xl font-bold">📖 Storybook</h1>
        <p className="text-fg-2 text-sm mt-1">Все компоненты в одном месте</p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* BUTTONS SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Button</h2>
          <div className="space-y-8">
            {/* Primary Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-fg-2">Primary (Заливка)</h3>
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button priority="primary" tone="brand" size="sm">
                    Small
                  </Button>
                  <Button priority="primary" tone="brand" size="md">
                    Medium
                  </Button>
                  <Button priority="primary" tone="brand" disabled>
                    Disabled
                  </Button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button priority="primary" tone="default" size="sm">
                    Default
                  </Button>
                  <Button priority="primary" tone="default" size="md">
                    Default Medium
                  </Button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button priority="primary" tone="error" size="sm">
                    Error
                  </Button>
                  <Button priority="primary" tone="error" size="md">
                    Error Medium
                  </Button>
                </div>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-fg-2">Secondary (Бордюр)</h3>
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button priority="secondary" tone="brand" size="sm">
                    Brand
                  </Button>
                  <Button priority="secondary" tone="brand" size="md">
                    Brand Medium
                  </Button>
                  <Button priority="secondary" tone="brand" disabled>
                    Disabled
                  </Button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button priority="secondary" tone="default" size="sm">
                    Default
                  </Button>
                  <Button priority="secondary" tone="default" size="md">
                    Default Medium
                  </Button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button priority="secondary" tone="error" size="sm">
                    Error
                  </Button>
                  <Button priority="secondary" tone="error" size="md">
                    Error Medium
                  </Button>
                </div>
              </div>
            </div>

            {/* Tertiary Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-fg-2">Tertiary (Текст)</h3>
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button priority="tertiary" tone="brand" size="sm">
                    Brand
                  </Button>
                  <Button priority="tertiary" tone="brand" size="md">
                    Brand Medium
                  </Button>
                  <Button priority="tertiary" tone="brand" disabled>
                    Disabled
                  </Button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button priority="tertiary" tone="default" size="sm">
                    Default
                  </Button>
                  <Button priority="tertiary" tone="default" size="md">
                    Default Medium
                  </Button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button priority="tertiary" tone="error" size="sm">
                    Error
                  </Button>
                  <Button priority="tertiary" tone="error" size="md">
                    Error Medium
                  </Button>
                </div>
              </div>
            </div>

            {/* Buttons with Icons */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-fg-2">С иконками</h3>
              <div className="flex gap-3 flex-wrap items-center">
                <Button
                  priority="primary"
                  tone="brand"
                  size="md"
                  leftIcon={<Icon name="check" />}
                >
                  Confirm
                </Button>
                <Button
                  priority="secondary"
                  tone="default"
                  size="md"
                  rightIcon={<Icon name="star" />}
                >
                  Rate
                </Button>
                <Button
                  priority="tertiary"
                  tone="default"
                  size="md"
                  leftIcon={<Icon name="settings" />}
                  rightIcon={<Icon name="check" />}
                >
                  Settings
                </Button>
                <Button
                  priority="primary"
                  tone="brand"
                  size="sm"
                  leftIcon={<Icon name="heart" />}
                  aria-label="Like"
                  iconOnly
                />
                <Button
                  priority="secondary"
                  tone="default"
                  size="md"
                  leftIcon={<Icon name="settings" />}
                  aria-label="Settings"
                  iconOnly
                />
              </div>
            </div>
          </div>
        </section>

        {/* FILTER PILLS SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">FilterPill</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-fg-2">Интерактивные фильтры</h3>
              <div className="flex gap-2 flex-wrap">
                {['Все', 'Популярные', 'Новое', 'Мои', 'Сохранённые'].map((label) => (
                  <FilterPill
                    key={label}
                    label={label}
                    isActive={selectedPills.includes(label)}
                    onClick={() => togglePill(label)}
                  />
                ))}
              </div>
              {selectedPills.length > 0 && (
                <p className="text-sm text-fg-2 mt-4">
                  Выбрано: {selectedPills.join(', ')}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-fg-2">Категории (как в ExercisesPage)</h3>
              <div className="flex gap-2 flex-wrap overflow-x-auto pb-2">
                {['Грудь', 'Спина', 'Бицепс', 'Трицепс', 'Ноги', 'Плечи', 'Пресс'].map((category) => (
                  <FilterPill
                    key={category}
                    label={category}
                    isActive={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* EXERCISE CARD SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">ExerciseCard</h2>
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <ExerciseCard
              id="1"
              name="Жим лежа"
              onSelect={() => toggleExercise('1')}
            />
            <ExerciseCard
              id="2"
              name="Тяга верхнего блока"
              onSelect={() => toggleExercise('2')}
            />
            <ExerciseCard
              id="3"
              name="Сгибание рук с гантелями"
              onSelect={() => toggleExercise('3')}
            />
            <ExerciseCard
              id="4"
              name="Жим ногами (очень длинное название для теста)"
              onSelect={() => toggleExercise('4')}
            />
          </div>
          {selectedExercises.length > 0 && (
            <p className="text-sm text-fg-2 mt-4">
              Выбрано упражнений: {selectedExercises.length}
            </p>
          )}
        </section>

        {/* COLOR PALETTE SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Color Palette</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-fg-2">Backgrounds</h3>
              <div className="flex gap-3 flex-wrap">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-1 border border-stroke-1 rounded-lg"></div>
                  <p className="text-xs text-fg-2 mt-2">bg-1</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-2 border border-stroke-1 rounded-lg"></div>
                  <p className="text-xs text-fg-2 mt-2">bg-2</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-3 border border-stroke-1 rounded-lg"></div>
                  <p className="text-xs text-fg-2 mt-2">bg-3</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-brand rounded-lg"></div>
                  <p className="text-xs text-fg-2 mt-2">bg-brand</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-fg-2">Foregrounds</h3>
              <div className="flex gap-3 flex-wrap">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-2 border border-stroke-1 rounded-lg flex items-center justify-center">
                    <p className="text-fg-1">fg-1</p>
                  </div>
                  <p className="text-xs text-fg-2 mt-2">Primary</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-2 border border-stroke-1 rounded-lg flex items-center justify-center">
                    <p className="text-fg-2">fg-2</p>
                  </div>
                  <p className="text-xs text-fg-2 mt-2">Secondary</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-2 border border-stroke-1 rounded-lg flex items-center justify-center">
                    <p className="text-fg-3">fg-3</p>
                  </div>
                  <p className="text-xs text-fg-2 mt-2">Tertiary</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-bg-2 border border-stroke-1 rounded-lg flex items-center justify-center">
                    <p className="text-fg-error">Error</p>
                  </div>
                  <p className="text-xs text-fg-2 mt-2">fg-error</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
