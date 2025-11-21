"""
Сервис для работы с тренировками
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional, List

from app.models.workout import Workout
from app.models.exercise import Exercise


class WorkoutService:
    """Сервис для операций с тренировками"""

    @staticmethod
    async def create_workout(
        session: AsyncSession,
        user_id: int,
        date: datetime,
        total_weight: Optional[float] = None,
        total_sets: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Workout:
        """Создать новую тренировку"""
        workout = Workout(
            user_id=user_id,
            date=date,
            total_weight=total_weight,
            total_sets=total_sets,
            notes=notes,
        )
        session.add(workout)
        await session.flush()
        return workout

    @staticmethod
    async def get_workout_by_id(
        session: AsyncSession, workout_id: int
    ) -> Optional[Workout]:
        """Получить тренировку по ID"""
        result = await session.execute(
            select(Workout).where(
                (Workout.id == workout_id) & (Workout.is_deleted == False)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_workouts(
        session: AsyncSession,
        user_id: int,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Workout]:
        """Получить все тренировки пользователя"""
        result = await session.execute(
            select(Workout)
            .where((Workout.user_id == user_id) & (Workout.is_deleted == False))
            .order_by(Workout.date.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    @staticmethod
    async def get_workouts_by_date_range(
        session: AsyncSession,
        user_id: int,
        start_date: datetime,
        end_date: datetime,
    ) -> List[Workout]:
        """Получить тренировки в диапазоне дат"""
        result = await session.execute(
            select(Workout).where(
                (Workout.user_id == user_id)
                & (Workout.date >= start_date)
                & (Workout.date <= end_date)
                & (Workout.is_deleted == False)
            )
        )
        return result.scalars().all()

    @staticmethod
    async def update_workout(
        session: AsyncSession,
        workout_id: int,
        user_id: int,
        date: Optional[datetime] = None,
        total_weight: Optional[float] = None,
        total_sets: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Workout]:
        """Обновить тренировку"""
        workout = await WorkoutService.get_workout_by_id(session, workout_id)

        if not workout or workout.user_id != user_id:
            return None

        if date is not None:
            workout.date = date
        if total_weight is not None:
            workout.total_weight = total_weight
        if total_sets is not None:
            workout.total_sets = total_sets
        if notes is not None:
            workout.notes = notes

        workout.updated_at = datetime.utcnow()
        await session.flush()
        return workout

    @staticmethod
    async def delete_workout(
        session: AsyncSession,
        workout_id: int,
        user_id: int,
    ) -> bool:
        """Удалить тренировку (soft delete)"""
        workout = await WorkoutService.get_workout_by_id(session, workout_id)

        if not workout or workout.user_id != user_id:
            return False

        workout.is_deleted = True
        workout.updated_at = datetime.utcnow()

        # Также удалить все упражнения в этой тренировке
        exercises = await session.execute(
            select(Exercise).where(Exercise.workout_id == workout_id)
        )
        for exercise in exercises.scalars().all():
            exercise.is_deleted = True

        await session.flush()
        return True

    @staticmethod
    async def get_monthly_statistics(
        session: AsyncSession,
        user_id: int,
        year: int,
        month: int,
    ) -> dict:
        """Получить статистику по тренировкам за месяц"""
        # Дата начала месяца
        start_date = datetime(year, month, 1)
        # Дата конца месяца
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)

        workouts = await WorkoutService.get_workouts_by_date_range(
            session, user_id, start_date, end_date
        )

        total_weight = sum(w.total_weight or 0 for w in workouts)
        total_sets = sum(w.total_sets or 0 for w in workouts)
        total_workouts = len(workouts)

        return {
            "year": year,
            "month": month,
            "total_workouts": total_workouts,
            "total_weight": total_weight,
            "total_sets": total_sets,
            "average_weight": total_weight / total_workouts if total_workouts > 0 else 0,
        }
