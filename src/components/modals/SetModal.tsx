import * as React from 'react';
import { Button } from '../main/Button';
import { TextField } from '../TextField';

export interface SetModalProps {
  isOpen: boolean;
  exerciseName: string;
  setNumber: number;
  mode?: 'create' | 'edit';
  initialValues?: {
    reps: number;
    weight: number;
  };
  confirmLabel?: string;
  onClose?: () => void;
  onConfirm?: (reps: number, weight: number) => void;
}

export const SetModal = React.forwardRef<HTMLDivElement, SetModalProps>(
  (
    {
      isOpen,
      exerciseName,
      setNumber,
      mode = 'create',
      initialValues,
      confirmLabel,
      onClose,
      onConfirm
    },
    ref
  ) => {
    const getStorageKey = (key: string) => `setModal_${exerciseName}_${key}`;

    const [reps, setReps] = React.useState<string>('10');
    const [weight, setWeight] = React.useState<string>('');
    const [weightError, setWeightError] = React.useState<boolean>(false);

    const isEditMode = mode === 'edit';

    const getSetLabel = (order: number) => {
      const lastTwo = order % 100;
      if (lastTwo >= 11 && lastTwo <= 14) {
        return `${order}-ый`;
      }
      const last = order % 10;
      if (last === 1) return `${order}-ый`;
      if (last === 2) return `${order}-ой`;
      return `${order}-ий`;
    };

    // Load saved reps value when modal opens or exercise changes
    React.useEffect(() => {
      if (!isOpen) return;

      if (isEditMode && initialValues) {
        setReps(initialValues.reps.toString());
        const formattedWeight = Number.isInteger(initialValues.weight)
          ? initialValues.weight.toString()
          : initialValues.weight.toString().replace('.', ',');
        setWeight(formattedWeight);
      } else {
        const savedReps = localStorage.getItem(getStorageKey('reps'));
        if (savedReps) {
          setReps(savedReps);
        } else {
          setReps('10');
        }
        setWeight('');
      }
      setWeightError(false);
    }, [isOpen, exerciseName, isEditMode, initialValues]);

    const handleConfirm = () => {
      if (!weight.trim()) {
        setWeightError(true);
        return;
      }

      // Normalize comma to dot for parsing
      const normalizedWeight = weight.replace(',', '.');
      const repsNum = parseInt(reps, 10);
      const weightNum = parseFloat(normalizedWeight);

      if (!isNaN(repsNum) && !isNaN(weightNum)) {
        // Save reps value for this exercise
        localStorage.setItem(getStorageKey('reps'), reps);
        onConfirm?.(repsNum, weightNum);
        // Reset weight field
        setWeight('');
        setWeightError(false);
      }
    };

    const handleWeightChange = (value: string) => {
      setWeight(value);
      if (value.trim()) {
        setWeightError(false);
      }
    };

    const handleClose = () => {
      // Reset form
      setReps('10');
      setWeight('');
      setWeightError(false);
      onClose?.();
    };

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 sm:px-6"
      >
        {/* Modal content - bottom sheet style */}
        <div className="w-full bg-bg-1 max-w-[640px]" style={{ padding: '16px', borderRadius: '16px 16px 0 0' }}>
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
            {getSetLabel(setNumber)} подход
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
          <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Reps input */}
            <TextField
              label="Повторы"
              value={reps}
              onChange={setReps}
              type="text"
              inputMode="numeric"
            />

            {/* Weight input */}
            <TextField
              label="Вес (кг)"
              value={weight}
              onChange={handleWeightChange}
              type="text"
              inputMode="decimal"
              error={weightError}
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
              tone={isEditMode ? 'default' : 'brand'}
              size="md"
              className="flex-1"
              onClick={handleConfirm}
            >
              {confirmLabel ?? (isEditMode ? 'Изменить' : 'Добавить')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

SetModal.displayName = 'SetModal';
