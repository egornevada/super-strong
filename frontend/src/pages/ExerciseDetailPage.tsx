import { useState, useEffect } from 'react'
import { ModalBig, AlertDialog, Button, DefaultStroke, SetModal, type Set } from '../components'
import { DotsSlider } from '../components/main-components/DotsSlider/DotsSlider'
import { fetchExerciseById, type Exercise } from '../services/directusApi'
import { useExerciseDetailSheet } from '../contexts/SheetContext'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import ClearRounded from '@mui/icons-material/ClearRounded'

interface ExerciseDetailPageProps {
  exerciseId: string
  onClose?: () => void
}

export function ExerciseDetailPage({
  exerciseId,
  onClose,
}: ExerciseDetailPageProps) {
  const { sheet, closeSheet } = useExerciseDetailSheet()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExerciseAdded, setIsExerciseAdded] = useState(sheet.isExerciseAdded ?? false)
  const [trackSets, setTrackSets] = useState<Set[]>([])
  const [isSetModalOpen, setIsSetModalOpen] = useState(false)
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadExercise = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchExerciseById(exerciseId)
        setExercise(data)
      } catch (err) {
        console.error('Failed to load exercise:', err)
        setError('Не удалось загрузить упражнение')
      } finally {
        setLoading(false)
      }
    }

    loadExercise()
  }, [exerciseId])

  // Sync exercise added state with sheet
  useEffect(() => {
    if (sheet.isExerciseAdded !== undefined) {
      setIsExerciseAdded(sheet.isExerciseAdded)
    }
  }, [sheet.isExerciseAdded])

  // Sync track sets from sheet
  useEffect(() => {
    if (sheet.trackSets) {
      setTrackSets(sheet.trackSets)
    }
  }, [sheet.trackSets])

  if (loading) {
    return (
      <ModalBig title="Информация" onClose={onClose}>
        <p className="text-fg-2 text-center py-8">Загрузка упражнения...</p>
      </ModalBig>
    )
  }

  if (error || !exercise) {
    return (
      <ModalBig title="Информация" onClose={onClose}>
        <p className="text-fg-2 text-center">{error || 'Упражнение не найдено'}</p>
      </ModalBig>
    )
  }

  const handleDeleteClick = () => {
    setShowDeleteAlert(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteAlert(false)
    // Вызываем callback для удаления из MyExercisesPage
    if (sheet.onDeleteExercise) {
      sheet.onDeleteExercise()
    }
    closeSheet()
    onClose?.()
  }

  const handleAddExercise = async () => {
    try {
      setIsProcessing(true)
      if (sheet.onAddExercise) {
        sheet.onAddExercise()
        setIsExerciseAdded(true)
      }
    } catch (err) {
      console.error('Failed to add exercise:', err)
      alert('Ошибка при добавлении упражнения')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveExercise = async () => {
    try {
      setIsProcessing(true)
      if (sheet.onRemoveExercise) {
        sheet.onRemoveExercise()
        setIsExerciseAdded(false)
      }
    } catch (err) {
      console.error('Failed to remove exercise:', err)
      alert('Ошибка при удалении упражнения')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddSet = (reps: number, weight: number) => {
    const newSets = [...trackSets, { reps, weight }]
    setTrackSets(newSets)
    sheet.onUpdateTrackSets?.(newSets)
  }

  const handleUpdateSet = (index: number, reps: number, weight: number) => {
    const updated = [...trackSets]
    if (updated[index]) {
      updated[index] = { reps, weight }
      setTrackSets(updated)
      sheet.onUpdateTrackSets?.(updated)
    }
  }

  const handleDeleteSet = (index: number) => {
    const newSets = trackSets.filter((_, i) => i !== index)
    setTrackSets(newSets)
    sheet.onUpdateTrackSets?.(newSets)
  }

  const openAddModal = () => {
    setEditingSetIndex(null)
    setIsSetModalOpen(true)
  }

  const openEditModal = (index: number) => {
    setEditingSetIndex(index)
    setIsSetModalOpen(true)
  }

  const handleSetModalClose = () => {
    setIsSetModalOpen(false)
    setEditingSetIndex(null)
  }

  const handleConfirmSet = (reps: number, weight: number) => {
    if (editingSetIndex !== null) {
      handleUpdateSet(editingSetIndex, reps, weight)
    } else {
      handleAddSet(reps, weight)
    }
    handleSetModalClose()
  }

  const handleSetDelete = (setIndex?: number) => {
    if (setIndex !== undefined) {
      handleDeleteSet(setIndex)
    }
    handleSetModalClose()
  }

  const formatSetLabel = (order: number) => {
    const lastTwo = order % 100
    if (lastTwo >= 11 && lastTwo <= 14) return `${order}-ый подход`
    const last = order % 10
    if (last === 1) return `${order}-ый подход`
    if (last === 2) return `${order}-ой подход`
    return `${order}-ий подход`
  }

  const formatNumber = (value: number) => {
    if (Number.isInteger(value)) {
      return value.toString()
    }
    return value
      .toLocaleString('ru-RU', { maximumFractionDigits: 2 })
      .replace(/\u00A0/g, ' ')
  }

  return (
    <ModalBig title={exercise.name} onClose={onClose}>
      {/* Exercise name as heading */}

      {/* Steps slider - if steps are available */}
      {exercise.steps && exercise.steps.length > 0 ? (
        <div className="mb-6">
          <DotsSlider steps={exercise.steps} exerciseName={exercise.name} />
        </div>
      ) : (
        /* Fallback to regular image if no steps */
        <div className="mb-6 rounded-lg overflow-hidden bg-bg-2 aspect-video">
          <img
            src={exercise.image?.url || `https://directus.webtga.ru/assets/${exercise.id}`}
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, hide it
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Info sections */}
      <div className="space-y-4">
        {/* Category */}
        <div>
          <p className="text-fg-3 text-sm mb-1">Категория</p>
          <p className="text-fg-1 font-medium">{exercise.category}</p>
        </div>

        {/* Description */}
        {exercise.description && (
          <div>
            <p className="text-fg-3 text-sm mb-1">Описание</p>
            <p className="text-fg-2">{exercise.description}</p>
          </div>
        )}

        {/* Additional fields from Directus */}
        {exercise.difficulty && (
          <div>
            <p className="text-fg-3 text-sm mb-1">Сложность</p>
            <p className="text-fg-1 font-medium">{exercise.difficulty}</p>
          </div>
        )}

        {exercise.muscleGroups && (
          <div>
            <p className="text-fg-3 text-sm mb-1">Группы мышц</p>
            <p className="text-fg-1 font-medium">
              {Array.isArray(exercise.muscleGroups)
                ? exercise.muscleGroups.join(', ')
                : exercise.muscleGroups}
            </p>
          </div>
        )}

        {/* Sets section - only show when opened from MyExercisesPage */}
        {sheet.onUpdateTrackSets && (
          <div>
            <p className="text-fg-3 text-sm mb-3">Подходы</p>
            {trackSets.length > 0 ? (
              <div className="space-y-2 mb-3">
                {trackSets.map((set, index) => (
                  <div
                    key={index}
                    className="cursor-pointer select-none p-2 rounded-lg hover:bg-bg-3 transition-colors"
                    onClick={() => openEditModal(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openEditModal(index)
                      }
                    }}
                  >
                    <DefaultStroke
                      label={formatSetLabel(index + 1)}
                      value={`${formatNumber(set.reps)} × ${formatNumber(set.weight)} кг`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-fg-3 text-sm mb-3">Еще не добавлено ни одного подхода</p>
            )}
            <Button
              priority="secondary"
              tone="default"
              size="M"
              className="w-full"
              onClick={openAddModal}
            >
              Добавить подход
            </Button>
          </div>
        )}

        {/* Add/Remove button for exercises page */}
        {(sheet.onAddExercise || sheet.onRemoveExercise) && (
          <div className="mt-6 -mx-3 -mb-3">
            <Button
              priority="secondary"
              tone={isExerciseAdded ? "default" : "default"}
              size="M"
              className="w-full"
              style={{
                borderRadius: '0',
                margin: '0',
                padding: '16px 12px',
                border: 'none',
                height: '64px',
                ...(isExerciseAdded && {
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff'
                })
              }}
              leftIcon={isExerciseAdded ? <ClearRounded /> : <AddRounded />}
              onClick={isExerciseAdded ? handleRemoveExercise : handleAddExercise}
              disabled={isProcessing}
            >
              {isExerciseAdded ? 'Убрать упражнение' : 'Добавить упражнение'}
            </Button>
          </div>
        )}

        {/* Delete button - if we have a delete callback */}
        {sheet.onDeleteExercise && (
          <div className="mt-6 -mx-3 -mb-3 border-t border-stroke-1">
            <Button
              priority="tertiary"
              tone="error"
              size="M"
              className="w-full"
              style={{
                borderRadius: '0',
                margin: '0',
                padding: '16px 12px 24px 12px',
                border: 'none',
                borderTop: '1px solid var(--stroke-1)',
                height: '64px'
              }}
              leftIcon={<DeleteOutlineRounded />}
              onClick={handleDeleteClick}
            >
              Удалить упражнение
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation alert */}
      <AlertDialog
        isOpen={showDeleteAlert}
        title="Удалить упражнение?"
        message={`Упражнение "${exercise.name}" будет удалено из текущей тренировки.`}
        confirmText="Удалить"
        cancelText="Отменить"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteAlert(false)}
      />

      {/* Set Modal */}
      <SetModal
        isOpen={isSetModalOpen}
        exerciseName={exercise.name}
        setNumber={editingSetIndex !== null ? editingSetIndex + 1 : trackSets.length + 1}
        mode={editingSetIndex !== null ? 'edit' : 'create'}
        initialValues={editingSetIndex !== null ? trackSets[editingSetIndex] : undefined}
        setIndex={editingSetIndex ?? undefined}
        onClose={handleSetModalClose}
        onConfirm={handleConfirmSet}
        onDelete={handleSetDelete}
      />
    </ModalBig>
  )
}
