import * as React from 'react';
import { Button } from '../main/Button';
import { SetModal } from '../modals';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export interface Set {
  reps: number;
  weight: number;
}

export interface TrackCardProps {
  name: string;
  image?: React.ReactNode;
  sets?: Set[];
  onAddSet?: (reps: number, weight: number) => void;
}

export const TrackCard = React.forwardRef<HTMLDivElement, TrackCardProps>(
  ({ name, image, sets = [], onAddSet }, ref) => {
    const [showModal, setShowModal] = React.useState(false);

    const handleAddSet = (reps: number, weight: number) => {
      onAddSet?.(reps, weight);
      setShowModal(false);
    };
    return (
      <div
        ref={ref}
        className="pt-3"
        style={{ paddingTop: '12px' }}
      >
        {/* Main card content - flex row with 8px gap */}
        <div className="flex items-center gap-2" style={{ gap: '8px' }}>
          {/* Image - 44x44 */}
          <div
            className="flex-shrink-0 bg-bg-3 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ width: '44px', height: '44px' }}
          >
            {image ? (
              image
            ) : (
              <svg
                className="w-6 h-6 text-fg-3"
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

          {/* Title - center, takes all free space */}
          <h3
            className="flex-1 text-fg-1 line-clamp-2"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '16px',
              letterSpacing: '-3%',
              marginRight: '8px'
            }}
          >
            {name}
          </h3>

          {/* Add button - right side */}
          <Button
            size="sm"
            priority="primary"
            tone="brand"
            leftIcon={<AddCircleIcon />}
            iconOnly
            onClick={() => setShowModal(true)}
            aria-label="Add set"
          />
        </div>

        {/* Sets list or empty state - 8px offset from card */}
        <div
          style={{
            marginTop: '8px'
          }}
        >
          {sets.length > 0 ? (
            <div className="space-y-2">
              {sets.map((set, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 text-sm"
                >
                  <span
                    className="text-fg-2"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      lineHeight: '16px',
                      minWidth: '60px'
                    }}
                  >
                    {index + 1}-{index === 0 ? 'ый' : index === 1 ? 'ой' : 'ий'} подход:
                  </span>
                  <span
                    className="text-fg-1"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      lineHeight: '16px',
                      fontWeight: 500
                    }}
                  >
                    {set.reps} × {set.weight} кг
                  </span>
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

        {/* Stroke divider */}
        <div
          className="border-b border-stroke-1"
          style={{
            marginTop: '12px'
          }}
        />

        {/* Set Modal */}
        <SetModal
          isOpen={showModal}
          exerciseName={name}
          setNumber={sets.length + 1}
          onClose={() => setShowModal(false)}
          onAdd={handleAddSet}
        />
      </div>
    );
  }
);

TrackCard.displayName = 'TrackCard';
