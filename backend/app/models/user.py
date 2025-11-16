"""
User моделе для API - работаем с таблицами которые уже созданы в БД через SQL
"""

from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from uuid import UUID


class User(BaseModel):
    """Модель User для работы с API (не SQLModel таблица)"""
    id: Optional[UUID] = None
    telegram_id: Optional[int] = None
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserDay(BaseModel):
    """Модель UserDay для работы с API"""
    id: Optional[UUID] = None
    user_id: UUID
    date: date
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
