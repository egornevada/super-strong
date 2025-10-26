import * as React from 'react';
import { Button } from '../main/Button';

export interface SetModalProps {
  isOpen: boolean;
  exerciseName: string;
  setNumber: number;
  onClose?: () => void;
  onAdd?: (reps: number, weight: number) => void;
}

export const SetModal = React.forwardRef<HTMLDivElement, SetModalProps>(
  ({ isOpen, exerciseName, setNumber, onClose, onAdd }, ref) => {
    const [reps, setReps] = React.useState<string>('10');
    const [weight, setWeight] = React.useState<string>('');

    const handleAdd = () => {
      const repsNum = parseInt(reps, 10);
      const weightNum = parseFloat(weight);

      if (!isNaN(repsNum) && !isNaN(weightNum)) {
        onAdd?.(repsNum, weightNum);
        // Reset form
        setReps('10');
        setWeight('');
      }
    };

    const handleClose = () => {
      // Reset form
      setReps('10');
      setWeight('');
      onClose?.();
    };

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className="fixed inset-0 bg-black/50 flex items-end z-50"
      >
        {/* Modal content - bottom sheet style */}
        <div className="w-full bg-bg-1" style={{ padding: '12px', borderRadius: '16px 16px 0 0' }}>
          {/* Set number label */}
          <p
            className="text-fg-3"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '16px',
              letterSpacing: '-3%',
              margin: 0,
              marginBottom: '2px'
            }}
          >
            {setNumber}-{setNumber === 1 ? 'ый' : setNumber === 2 ? 'ой' : 'ий'} подход
          </p>

          {/* Exercise name */}
          <h2
            className="text-fg-2"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              lineHeight: '24px',
              letterSpacing: '-3%',
              margin: 0,
              marginBottom: '12px'
            }}
          >
            {exerciseName}
          </h2>

          {/* Form fields */}
          <div style={{ marginBottom: '12px' }}>
            {/* Reps input */}
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Повторы"
              className="w-full px-4 py-3 bg-bg-2 border border-stroke-1 rounded-2xl text-fg-1 placeholder-fg-2 mb-3"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}
            />

            {/* Weight input */}
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Вес (кг)"
              className="w-full px-4 py-3 bg-bg-2 border border-stroke-1 rounded-2xl text-fg-1 placeholder-fg-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3" style={{ gap: '12px' }}>
            <Button
              priority="secondary"
              tone="default"
              size="md"
              className="flex-1"
              onClick={handleClose}
            >
              Отменить
            </Button>
            <Button
              priority="primary"
              tone="brand"
              size="md"
              className="flex-1"
              onClick={handleAdd}
            >
              Добавить
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

SetModal.displayName = 'SetModal';
