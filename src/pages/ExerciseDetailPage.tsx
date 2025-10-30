import { useState, useEffect } from 'react'
import { PageLayout } from '../components/PageLayout'
import { fetchExerciseById, type Exercise } from '../services/directusApi'

interface ExerciseDetailPageProps {
  exerciseId: string
  onClose?: () => void
}

export function ExerciseDetailPage({
  exerciseId,
  onClose,
}: ExerciseDetailPageProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <PageLayout title="Информация" onClose={onClose}>
      {/* Exercise name as heading */}
      <h2 className="text-fg-1 text-2xl font-semibold mb-6">{exercise.name}</h2>

      {/* Image */}
      {exercise.image && (
        <div className="mb-6 rounded-lg overflow-hidden bg-bg-2 aspect-video">
          <img
            src={exercise.image.url}
            alt={exercise.name}
            className="w-full h-full object-cover"
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
      </div>
    </PageLayout>
  )
}
