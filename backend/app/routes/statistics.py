"""
API маршруты для статистики тренировок
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import List

from app.database import get_session
from app.services.statistics import StatisticsService
from app.services.auth import AuthService

router = APIRouter(prefix="/api/v1/statistics", tags=["statistics"])


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


@router.get("/daily")
async def get_daily_statistics(
    date: str,  # YYYY-MM-DD
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить статистику за день.

    Требует JWT токена в query параметре `token`
    Параметр date в формате YYYY-MM-DD
    """
    try:
        user_id = await get_current_user_id(token)

        # Парсить дату
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный формат даты. Используйте YYYY-MM-DD",
            )

        statistics = await StatisticsService.get_daily_statistics(
            session=session,
            user_id=user_id,
            date=parsed_date,
        )

        return statistics or {
            "date": parsed_date.date(),
            "workout_count": 0,
            "total_exercises": 0,
            "total_weight": 0,
            "total_sets": 0,
            "total_reps": 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении статистики за день: {str(e)}",
        )


@router.get("/weekly")
async def get_weekly_statistics(
    date: str,  # YYYY-MM-DD (дата из нужной недели)
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить статистику за неделю.

    Требует JWT токена в query параметре `token`
    Параметр date в формате YYYY-MM-DD (дата из нужной недели)
    """
    try:
        user_id = await get_current_user_id(token)

        # Парсить дату
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный формат даты. Используйте YYYY-MM-DD",
            )

        statistics = await StatisticsService.get_weekly_statistics(
            session=session,
            user_id=user_id,
            date=parsed_date,
        )

        return statistics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении недельной статистики: {str(e)}",
        )


@router.get("/monthly")
async def get_monthly_statistics(
    year: int,
    month: int,
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить статистику за месяц.

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

        statistics = await StatisticsService.get_monthly_statistics(
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
            detail=f"Ошибка при получении месячной статистики: {str(e)}",
        )


@router.get("/exercise/{exercise_id}")
async def get_exercise_statistics(
    exercise_id: str,
    days: int = 30,
    token: str = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить статистику по конкретному упражнению.

    Требует JWT токена в query параметре `token`
    Параметр days - за сколько дней считать (по умолчанию 30)
    """
    try:
        user_id = await get_current_user_id(token)

        statistics = await StatisticsService.get_exercise_statistics(
            session=session,
            user_id=user_id,
            exercise_id=exercise_id,
            days=days,
        )

        return statistics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении статистики упражнения: {str(e)}",
        )


@router.get("/trending")
async def get_trending_exercises(
    limit: int = 10,
    token: str = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Получить топ упражнений по количеству сессий.

    Требует JWT токена в query параметре `token`
    """
    try:
        user_id = await get_current_user_id(token)

        trending = await StatisticsService.get_trending_exercises(
            session=session,
            user_id=user_id,
            limit=limit,
        )

        return {"trending": trending}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении трендовых упражнений: {str(e)}",
        )
