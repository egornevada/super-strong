"""
API маршруты для упражнений (Exercises)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_session
from app.services.exercise import ExerciseService
from app.services.workout import WorkoutService
from app.services.auth import AuthService
from app.schemas.exercise import (
    ExerciseCreateRequest,
    ExerciseUpdateRequest,
    ExerciseResponse,
    ExerciseListResponse,
)

router = APIRouter(prefix="/api/v1/workouts", tags=["exercises"])


async def get_current_user_id(token: str = None) -> int:
    """Получить ID текущего пользователя из JWT токена"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не предоставлен токен",
        )

    payload = AuthService.verify_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный токен",
        )

    return payload["user_id"]


@router.post(
    "/{workout_id}/exercises",
    response_model=ExerciseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_exercise(
    workout_id: int,
    request: ExerciseCreateRequest,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Создать новое упражнение в тренировке.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        # Проверить, что тренировка существует и принадлежит пользователю
        workout = await WorkoutService.get_workout_by_id(session, workout_id)
        if not workout or workout.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Тренировка не найдена",
            )

        exercise = await ExerciseService.create_exercise(
            session=session,
            workout_id=workout_id,
            exercise_id=request.exercise_id,
            weight=request.weight,
            sets=request.sets,
            reps=request.reps,
            notes=request.notes,
            order=request.order,
        )
        await session.commit()

        return ExerciseResponse.model_validate(exercise)
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при создании упражнения: {str(e)}",
        )


@router.get("/{workout_id}/exercises", response_model=List[ExerciseListResponse])
async def list_workout_exercises(
    workout_id: int,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить список всех упражнений в тренировке.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        # Проверить, что тренировка существует и принадлежит пользователю
        workout = await WorkoutService.get_workout_by_id(session, workout_id)
        if not workout or workout.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Тренировка не найдена",
            )

        exercises = await ExerciseService.get_workout_exercises(
            session=session,
            workout_id=workout_id,
        )

        return [ExerciseListResponse.model_validate(e) for e in exercises]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении упражнений: {str(e)}",
        )


@router.get("/{workout_id}/exercises/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    workout_id: int,
    exercise_id: int,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить детали конкретного упражнения.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        # Проверить, что тренировка существует и принадлежит пользователю
        workout = await WorkoutService.get_workout_by_id(session, workout_id)
        if not workout or workout.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Тренировка не найдена",
            )

        exercise = await ExerciseService.get_exercise_by_id(session, exercise_id)

        if not exercise or exercise.workout_id != workout_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Упражнение не найдено",
            )

        return ExerciseResponse.model_validate(exercise)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении упражнения: {str(e)}",
        )


@router.put(
    "/{workout_id}/exercises/{exercise_id}",
    response_model=ExerciseResponse,
)
async def update_exercise(
    workout_id: int,
    exercise_id: int,
    request: ExerciseUpdateRequest,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Обновить данные упражнения.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        exercise = await ExerciseService.update_exercise(
            session=session,
            exercise_id=exercise_id,
            workout_id=workout_id,
            user_id=user_id,
            weight=request.weight,
            sets=request.sets,
            reps=request.reps,
            notes=request.notes,
            order=request.order,
        )

        if not exercise:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Упражнение не найдено",
            )

        await session.commit()
        return ExerciseResponse.model_validate(exercise)
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при обновлении упражнения: {str(e)}",
        )


@router.delete(
    "/{workout_id}/exercises/{exercise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_exercise(
    workout_id: int,
    exercise_id: int,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Удалить упражнение.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        success = await ExerciseService.delete_exercise(
            session=session,
            exercise_id=exercise_id,
            workout_id=workout_id,
            user_id=user_id,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Упражнение не найдено",
            )

        await session.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при удалении упражнения: {str(e)}",
        )


@router.post("/{workout_id}/exercises/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_exercises(
    workout_id: int,
    order_data: List[dict],  # [{"exercise_id": int, "order": int}, ...]
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Переупорядочить упражнения в тренировке.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        success = await ExerciseService.reorder_exercises(
            session=session,
            workout_id=workout_id,
            user_id=user_id,
            order_data=order_data,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Тренировка не найдена",
            )

        await session.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при переупорядочивании упражнений: {str(e)}",
        )
