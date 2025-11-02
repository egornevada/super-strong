import * as React from 'react';
import { Button } from '../main/Button';
import { SetModal } from '../modals';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export interface Set {
  reps: number;
  weight: number;
}

export interface TrackCardProps {
  id?: string;
  name: string;
  image?: React.ReactNode;
  subtitle?: string;
  sets?: Set[];
  onAddSet?: (reps: number, weight: number) => void;
  onUpdateSet?: (index: number, reps: number, weight: number) => void;
  onImageClick?: (id: string) => void;
}

export const TrackCard = React.forwardRef<HTMLDivElement, TrackCardProps>(
  (
    { id = '', name, image, subtitle, sets = [], onAddSet, onUpdateSet, onImageClick },
    ref
  ) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingSetIndex, setEditingSetIndex] = React.useState<number | null>(null);

    const handleImageClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      onImageClick?.(id);
    };

    const formatSetLabel = (order: number) => {
      const lastTwo = order % 100;
      if (lastTwo >= 11 && lastTwo <= 14) return `${order}-ый подход`;
      const last = order % 10;
      if (last === 1) return `${order}-ый подход`;
      if (last === 2) return `${order}-ой подход`;
      return `${order}-ий подход`;
    };

    const formatNumber = (value: number) => {
      if (Number.isInteger(value)) {
        return value.toString();
      }
      return value
        .toLocaleString('ru-RU', { maximumFractionDigits: 2 })
        .replace(/\u00A0/g, ' ');
    };

    const openAddModal = () => {
      setEditingSetIndex(null);
      setIsModalOpen(true);
    };

    const openEditModal = (index: number) => {
      setEditingSetIndex(index);
      setIsModalOpen(true);
    };

    const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingSetIndex(null);
    };

    const handleConfirmSet = (reps: number, weight: number) => {
      if (editingSetIndex !== null) {
        onUpdateSet?.(editingSetIndex, reps, weight);
      } else {
        onAddSet?.(reps, weight);
      }
      handleModalClose();
    };

    const modalMode = editingSetIndex !== null ? 'edit' : 'create';
    const modalSetNumber = editingSetIndex !== null ? editingSetIndex + 1 : sets.length + 1;
    const editingSet = editingSetIndex !== null ? sets[editingSetIndex] : undefined;

    return (
      <div
        ref={ref}
        className="pt-3"
        style={{ paddingTop: '12px' }}
      >
        <div className="flex items-start gap-3" style={{ gap: '12px' }}>
          <div
            className="flex-shrink-0 bg-bg-3 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            style={{ width: '56px', height: '56px' }}
            onClick={handleImageClick}
          >
            {image ? (
              image
            ) : (
              <svg
                className="w-7 h-7 text-fg-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="text-fg-1 line-clamp-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                lineHeight: '20px',
                letterSpacing: '-3%',
                margin: 0,
                marginBottom: subtitle ? '2px' : 0
              }}
            >
              {name}
            </h3>
            {subtitle ? (
              <p
                className="text-fg-3 line-clamp-1"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '-2%',
                  margin: 0
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <Button
            size="sm"
            priority="primary"
            tone="brand"
            leftIcon={<AddCircleIcon />}
            iconOnly
            onClick={openAddModal}
            aria-label="Add set"
          />
        </div>

        <div
          style={{
            marginTop: '12px'
          }}
        >
          {sets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {sets.map((set, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 cursor-pointer select-none"
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditModal(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openEditModal(index);
                    }
                  }}
                  aria-label={`Изменить ${formatSetLabel(index + 1)}`}
                >
                  <span
                    className="text-fg-2"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      lineHeight: '16px',
                      minWidth: '88px'
                    }}
                  >
                    {formatSetLabel(index + 1)}:
                  </span>
                  <div
                    className="inline-flex items-center bg-bg-2 text-fg-1"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      lineHeight: '16px',
                      fontWeight: 600,
                      padding: '6px 14px',
                      borderRadius: '9999px'
                    }}
                  >
                    {formatNumber(set.reps)} × {formatNumber(set.weight)} кг
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '21px', display: 'flex', alignItems: 'center' }}>
              <p
                className="text-fg-3"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  lineHeight: '16px',
                  margin: 0
                }}
              >
                Еще не добавлено ни одного подхода
              </p>
            </div>
          )}
        </div>

        <div
          className="border-b border-stroke-1"
          style={{
            marginTop: '16px'
          }}
        />

        <SetModal
          isOpen={isModalOpen}
          exerciseName={name}
          setNumber={modalSetNumber}
          mode={modalMode}
          initialValues={editingSet}
          onClose={handleModalClose}
          onConfirm={handleConfirmSet}
        />
      </div>
    );
  }
);

TrackCard.displayName = 'TrackCard';
