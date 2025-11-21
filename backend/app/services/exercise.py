"""
Сервис для работы с упражнениями
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional, List

from app.models.exercise import Exercise
from app.models.workout import Workout


class ExerciseService:
    """Сервис для операций с упражнениями"""

    @staticmethod
    async def create_exercise(
        session: AsyncSession,
        workout_id: int,
        exercise_id: str,
        weight: Optional[float] = None,
        sets: Optional[int] = None,
        reps: Optional[int] = None,
        notes: Optional[str] = None,
        order: int = 0,
    ) -> Exercise:
        """Создать новое упражнение в тренировке"""
        exercise = Exercise(
            workout_id=workout_id,
            exercise_id=exercise_id,
            weight=weight,
            sets=sets,
            reps=reps,
            notes=notes,
            order=order,
        )
        session.add(exercise)
        await session.flush()
        return exercise

    @staticmethod
    async def get_exercise_by_id(
        session: AsyncSession, exercise_id: int
    ) -> Optional[Exercise]:
        """Получить упражнение по ID"""
        result = await session.execute(
            select(Exercise).where(
                (Exercise.id == exercise_id) & (Exercise.is_deleted == False)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_workout_exercises(
        session: AsyncSession,
        workout_id: int,
    ) -> List[Exercise]:
        """Получить все упражнения в тренировке"""
        result = await session.execute(
            select(Exercise)
            .where((Exercise.workout_id == workout_id) & (Exercise.is_deleted == False))
            .order_by(Exercise.order)
        )
        return result.scalars().all()

    @staticmethod
    async def update_exercise(
        session: AsyncSession,
        exercise_id: int,
        workout_id: int,
        user_id: int,
        weight: Optional[float] = None,
        sets: Optional[int] = None,
        reps: Optional[int] = None,
        notes: Optional[str] = None,
        order: Optional[int] = None,
    ) -> Optional[Exercise]:
        """Обновить упражнение"""
        # Получить упражнение
        exercise = await ExerciseService.get_exercise_by_id(session, exercise_id)

        if not exercise or exercise.workout_id != workout_id:
            return None

        # Проверить, что пользователь владеет тренировкой
        workout = await session.execute(
            select(Workout).where(Workout.id == workout_id)
        )
        workout_obj = workout.scalar_one_or_none()

        if not workout_obj or workout_obj.user_id != user_id:
            return None

        if weight is not None:
            exercise.weight = weight
        if sets is not None:
            exercise.sets = sets
        if reps is not None:
            exercise.reps = reps
        if notes is not None:
            exercise.notes = notes
        if order is not None:
            exercise.order = order

        exercise.updated_at = datetime.utcnow()
        await session.flush()
        return exercise

    @staticmethod
    async def delete_exercise(
        session: AsyncSession,
        exercise_id: int,
        workout_id: int,
        user_id: int,
    ) -> bool:
        """Удалить упражнение (soft delete)"""
        # Получить упражнение
        exercise = await ExerciseService.get_exercise_by_id(session, exercise_id)

        if not exercise or exercise.workout_id != workout_id:
            return False

        # Проверить, что пользователь владеет тренировкой
        workout = await session.execute(
            select(Workout).where(Workout.id == workout_id)
        )
        workout_obj = workout.scalar_one_or_none()

        if not workout_obj or workout_obj.user_id != user_id:
            return False

        exercise.is_deleted = True
        exercise.updated_at = datetime.utcnow()

        await session.flush()
        return True

    @staticmethod
    async def reorder_exercises(
        session: AsyncSession,
        workout_id: int,
        user_id: int,
        order_data: List[dict],  # [{"exercise_id": int, "order": int}, ...]
    ) -> bool:
        """Переупорядочить упражнения в тренировке"""
        # Проверить, что пользователь владеет тренировкой
        workout = await session.execute(
            select(Workout).where(Workout.id == workout_id)
        )
        workout_obj = workout.scalar_one_or_none()

        if not workout_obj or workout_obj.user_id != user_id:
            return False

        # Обновить порядок
        for item in order_data:
            exercise = await ExerciseService.get_exercise_by_id(
                session, item["exercise_id"]
            )
            if exercise and exercise.workout_id == workout_id:
                exercise.order = item["order"]
                exercise.updated_at = datetime.utcnow()

        await session.flush()
        return True
