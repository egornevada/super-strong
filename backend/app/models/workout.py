"""
Workout (тренировка) - Pydantic модель для API
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class Workout(BaseModel):
    """Модель Workout для работы с API"""
    id: Optional[int] = None
    user_id: UUID
    date: datetime
    total_weight: Optional[float] = None
    total_sets: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False
