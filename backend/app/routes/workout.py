"""
API маршруты для тренировок (Workouts)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import List

from app.database import get_session
from app.services.workout import WorkoutService
from app.services.auth import AuthService
from app.schemas.workout import (
    WorkoutCreateRequest,
    WorkoutUpdateRequest,
    WorkoutResponse,
    WorkoutListResponse,
)

router = APIRouter(prefix="/api/v1/workouts", tags=["workouts"])


async def get_current_user_id(token: str = None) -> int:
    """
    Получить ID текущего пользователя из JWT токена.

    Временная реализация - в production нужно использовать
    Depends(HTTPBearer()) с правильной обработкой заголовков
    """
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


@router.post("", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def create_workout(
    request: WorkoutCreateRequest,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Создать новую тренировку.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        workout = await WorkoutService.create_workout(
            session=session,
            user_id=user_id,
            date=request.date,
            total_weight=request.total_weight,
            total_sets=request.total_sets,
            notes=request.notes,
        )
        await session.commit()

        return WorkoutResponse.model_validate(workout)
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при создании тренировки: {str(e)}",
        )


@router.get("", response_model=List[WorkoutListResponse])
async def list_workouts(
    token: str,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить список тренировок текущего пользователя.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        workouts = await WorkoutService.get_user_workouts(
            session=session,
            user_id=user_id,
            limit=limit,
            offset=offset,
        )

        return [WorkoutListResponse.model_validate(w) for w in workouts]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении тренировок: {str(e)}",
        )


@router.get("/{workout_id}", response_model=WorkoutResponse)
async def get_workout(
    workout_id: int,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить детали конкретной тренировки.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        workout = await WorkoutService.get_workout_by_id(session, workout_id)

        if not workout or workout.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Тренировка не найдена",
            )

        return WorkoutResponse.model_validate(workout)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении тренировки: {str(e)}",
        )


@router.put("/{workout_id}", response_model=WorkoutResponse)
async def update_workout(
    workout_id: int,
    request: WorkoutUpdateRequest,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Обновить данные тренировки.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        workout = await WorkoutService.update_workout(
            session=session,
            workout_id=workout_id,
            user_id=user_id,
            date=request.date,
            total_weight=request.total_weight,
            total_sets=request.total_sets,
            notes=request.notes,
        )

        if not workout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Тренировка не найдена",
            )

        await session.commit()
        return WorkoutResponse.model_validate(workout)
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при обновлении тренировки: {str(e)}",
        )


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: int,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Удалить тренировку.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        success = await WorkoutService.delete_workout(
            session=session,
            workout_id=workout_id,
            user_id=user_id,
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
            detail=f"Ошибка при удалении тренировки: {str(e)}",
        )


@router.get("/statistics/monthly", response_model=dict)
async def get_monthly_statistics(
    year: int,
    month: int,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить статистику по тренировкам за месяц.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        # Валидация месяца
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Месяц должен быть от 1 до 12",
            )

        statistics = await WorkoutService.get_monthly_statistics(
            session=session,
            user_id=user_id,
            year=year,
            month=month,
        )

        return statistics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении статистики: {str(e)}",
        )
