"""
Exercise (упражнение) и BugReport - Pydantic модели для API
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class Exercise(BaseModel):
    """Модель Exercise для работы с API"""
    id: Optional[int] = None
    workout_id: Optional[int] = None
    exercise_id: str
    directus_id: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    weight: Optional[float] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    notes: Optional[str] = None
    order: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False


class BugReport(BaseModel):
    """Модель BugReport для работы с API"""
    id: Optional[int] = None
    telegram_username: str
    browser_info: str
    message: str
    page: Optional[str] = None
    created_at: Optional[datetime] = None
