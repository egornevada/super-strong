"""
Сервис для расчёта статистики тренировок
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional, List, Dict

from app.models.workout import Workout
from app.models.exercise import Exercise


class StatisticsService:
    """Сервис для операций со статистикой"""

    @staticmethod
    async def get_daily_statistics(
        session: AsyncSession,
        user_id: int,
        date: datetime,
    ) -> Optional[dict]:
        """Получить статистику за день"""
        # Начало и конец дня
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1) - timedelta(seconds=1)

        # Получить тренировку за этот день
        workouts_result = await session.execute(
            select(Workout).where(
                (Workout.user_id == user_id)
                & (Workout.date >= start_of_day)
                & (Workout.date <= end_of_day)
                & (Workout.is_deleted == False)
            )
        )
        workouts = workouts_result.scalars().all()

        if not workouts:
            return None

        total_weight = sum(w.total_weight or 0 for w in workouts)
        total_sets = sum(w.total_sets or 0 for w in workouts)
        total_exercises = 0
        total_reps = 0

        # Получить все упражнения за этот день
        for workout in workouts:
            exercises_result = await session.execute(
                select(Exercise).where(
                    (Exercise.workout_id == workout.id)
                    & (Exercise.is_deleted == False)
                )
            )
            exercises = exercises_result.scalars().all()
            total_exercises += len(exercises)
            total_reps += sum(e.reps or 0 for e in exercises)

        return {
            "date": date.date(),
            "workout_count": len(workouts),
            "total_exercises": total_exercises,
            "total_weight": total_weight,
            "total_sets": total_sets,
            "total_reps": total_reps,
        }

    @staticmethod
    async def get_weekly_statistics(
        session: AsyncSession,
        user_id: int,
        date: datetime,
    ) -> dict:
        """Получить статистику за неделю"""
        # Понедельник текущей недели
        monday = date - timedelta(days=date.weekday())
        monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
        # Воскресенье текущей недели
        sunday = monday + timedelta(days=7) - timedelta(seconds=1)

        workouts_result = await session.execute(
            select(Workout).where(
                (Workout.user_id == user_id)
                & (Workout.date >= monday)
                & (Workout.date <= sunday)
                & (Workout.is_deleted == False)
            )
        )
        workouts = workouts_result.scalars().all()

        total_weight = sum(w.total_weight or 0 for w in workouts)
        total_sets = sum(w.total_sets or 0 for w in workouts)
        total_exercises = 0
        total_reps = 0

        for workout in workouts:
            exercises_result = await session.execute(
                select(Exercise).where(
                    (Exercise.workout_id == workout.id)
                    & (Exercise.is_deleted == False)
                )
            )
            exercises = exercises_result.scalars().all()
            total_exercises += len(exercises)
            total_reps += sum(e.reps or 0 for e in exercises)

        return {
            "week_start": monday.date(),
            "week_end": sunday.date(),
            "workout_count": len(workouts),
            "total_exercises": total_exercises,
            "total_weight": total_weight,
            "total_sets": total_sets,
            "total_reps": total_reps,
            "average_weight_per_workout": total_weight / len(workouts) if workouts else 0,
        }

    @staticmethod
    async def get_monthly_statistics(
        session: AsyncSession,
        user_id: int,
        year: int,
        month: int,
    ) -> dict:
        """Получить статистику за месяц"""
        # Первый день месяца
        start_date = datetime(year, month, 1)
        # Последний день месяца
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)

        workouts_result = await session.execute(
            select(Workout).where(
                (Workout.user_id == user_id)
                & (Workout.date >= start_date)
                & (Workout.date <= end_date)
                & (Workout.is_deleted == False)
            )
        )
        workouts = workouts_result.scalars().all()

        total_weight = sum(w.total_weight or 0 for w in workouts)
        total_sets = sum(w.total_sets or 0 for w in workouts)
        total_exercises = 0
        total_reps = 0

        for workout in workouts:
            exercises_result = await session.execute(
                select(Exercise).where(
                    (Exercise.workout_id == workout.id)
                    & (Exercise.is_deleted == False)
                )
            )
            exercises = exercises_result.scalars().all()
            total_exercises += len(exercises)
            total_reps += sum(e.reps or 0 for e in exercises)

        return {
            "year": year,
            "month": month,
            "workout_count": len(workouts),
            "total_exercises": total_exercises,
            "total_weight": total_weight,
            "total_sets": total_sets,
            "total_reps": total_reps,
            "average_weight_per_workout": total_weight / len(workouts) if workouts else 0,
            "average_exercises_per_workout": total_exercises / len(workouts) if workouts else 0,
        }

    @staticmethod
    async def get_exercise_statistics(
        session: AsyncSession,
        user_id: int,
        exercise_id: str,
        days: int = 30,
    ) -> dict:
        """Получить статистику по конкретному упражнению за период"""
        # Дата начала периода
        start_date = datetime.utcnow() - timedelta(days=days)

        exercises_result = await session.execute(
            select(Exercise).where(
                (Exercise.exercise_id == exercise_id)
                & (Exercise.is_deleted == False)
            )
        )
        exercises = exercises_result.scalars().all()

        # Фильтруем по пользователю и дате
        user_exercises = []
        for exercise in exercises:
            workout_result = await session.execute(
                select(Workout).where(
                    (Workout.id == exercise.workout_id)
                    & (Workout.user_id == user_id)
                    & (Workout.date >= start_date)
                )
            )
            workout = workout_result.scalar_one_or_none()
            if workout:
                user_exercises.append(exercise)

        if not user_exercises:
            return {
                "exercise_id": exercise_id,
                "total_sessions": 0,
                "total_weight": 0,
                "total_sets": 0,
                "total_reps": 0,
                "max_weight": None,
                "average_weight": 0,
            }

        total_weight = sum(e.weight or 0 for e in user_exercises)
        total_sets = sum(e.sets or 0 for e in user_exercises)
        total_reps = sum(e.reps or 0 for e in user_exercises)
        max_weight = max((e.weight or 0 for e in user_exercises), default=0)

        return {
            "exercise_id": exercise_id,
            "total_sessions": len(user_exercises),
            "total_weight": total_weight,
            "total_sets": total_sets,
            "total_reps": total_reps,
            "max_weight": max_weight if max_weight > 0 else None,
            "average_weight": total_weight / len(user_exercises) if user_exercises else 0,
        }

    @staticmethod
    async def get_trending_exercises(
        session: AsyncSession,
        user_id: int,
        limit: int = 10,
    ) -> List[dict]:
        """Получить топ упражнений по количеству сессий"""
        workouts_result = await session.execute(
            select(Workout).where(
                (Workout.user_id == user_id) & (Workout.is_deleted == False)
            )
        )
        workouts = workouts_result.scalars().all()
        workout_ids = [w.id for w in workouts]

        if not workout_ids:
            return []

        # Подсчитать упражнения
        exercise_counts = {}
        for workout_id in workout_ids:
            exercises_result = await session.execute(
                select(Exercise).where(
                    (Exercise.workout_id == workout_id)
                    & (Exercise.is_deleted == False)
                )
            )
            exercises = exercises_result.scalars().all()
            for exercise in exercises:
                exercise_counts[exercise.exercise_id] = (
                    exercise_counts.get(exercise.exercise_id, 0) + 1
                )

        # Отсортировать и вернуть топ
        sorted_exercises = sorted(
            exercise_counts.items(), key=lambda x: x[1], reverse=True
        )
        return [
            {"exercise_id": ex_id, "session_count": count}
            for ex_id, count in sorted_exercises[:limit]
        ]
