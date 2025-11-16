"""
Схемы для Exercise (упражнение в тренировке)
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExerciseCreateRequest(BaseModel):
    """Запрос на создание упражнения в тренировке"""
    exercise_id: str  # ID из Directus
    weight: Optional[float] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    notes: Optional[str] = None
    order: int = 0


class ExerciseUpdateRequest(BaseModel):
    """Запрос на обновление упражнения"""
    weight: Optional[float] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    notes: Optional[str] = None
    order: Optional[int] = None


class ExerciseResponse(BaseModel):
    """Ответ с данными упражнения"""
    id: int
    workout_id: int
    exercise_id: str
    weight: Optional[float] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    notes: Optional[str] = None
    order: int
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


class ExerciseListResponse(BaseModel):
    """Ответ со списком упражнений"""
    id: int
    exercise_id: str
    weight: Optional[float] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    notes: Optional[str] = None
    order: int
    created_at: datetime

    class Config:
        from_attributes = True
