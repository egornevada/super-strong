"""
Схемы для Workout (тренировка)
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WorkoutCreateRequest(BaseModel):
    """Запрос на создание тренировки"""
    date: datetime
    total_weight: Optional[float] = None
    total_sets: Optional[int] = None
    notes: Optional[str] = None


class WorkoutUpdateRequest(BaseModel):
    """Запрос на обновление тренировки"""
    date: Optional[datetime] = None
    total_weight: Optional[float] = None
    total_sets: Optional[int] = None
    notes: Optional[str] = None


class WorkoutResponse(BaseModel):
    """Ответ с данными тренировки"""
    id: int
    user_id: int
    date: datetime
    total_weight: Optional[float] = None
    total_sets: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


class WorkoutListResponse(BaseModel):
    """Ответ со списком тренировок"""
    id: int
    date: datetime
    total_weight: Optional[float] = None
    total_sets: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
