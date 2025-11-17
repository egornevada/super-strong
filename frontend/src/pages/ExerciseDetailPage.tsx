import { useState, useEffect } from 'react'
import { PageLayout } from '../components/PageLayout'
import { AlertDialog, Button } from '../components'
import { StepsSlider } from '../components/StepsSlider/StepsSlider'
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

  if (loading) {
    return (
      <PageLayout title="Информация" onClose={onClose}>
        <p className="text-fg-2 text-center py-8">Загрузка упражнения...</p>
      </PageLayout>
    )
  }

  if (error || !exercise) {
    return (
      <PageLayout title="Информация" onClose={onClose}>
        <p className="text-fg-2 text-center">{error || 'Упражнение не найдено'}</p>
      </PageLayout>
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

  return (
    <PageLayout title={exercise.name} onClose={onClose}>
      {/* Exercise name as heading */}

      {/* Steps slider - if steps are available */}
      {exercise.steps && exercise.steps.length > 0 ? (
        <div className="mb-6">
          <StepsSlider steps={exercise.steps} exerciseName={exercise.name} />
        </div>
      ) : exercise.image ? (
        /* Fallback to regular image if no steps */
        <div className="mb-6 rounded-lg overflow-hidden bg-bg-2 aspect-video">
          <img
            src={exercise.image.url}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

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

        {/* Add/Remove button for exercises page */}
        {(sheet.onAddExercise || sheet.onRemoveExercise) && (
          <div className="mt-6 -mx-3 -mb-3">
            <Button
              priority="secondary"
              tone={isExerciseAdded ? "default" : "default"}
              size="md"
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
              size="md"
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
    </PageLayout>
  )
}
