"""
Supabase User API Schemas
Request and response models for user operations
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateUserRequest(BaseModel):
    """Request model for creating a user"""
    username: str
    telegram_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class GetOrCreateUserRequest(BaseModel):
    """Request model for getting or creating a user"""
    username: str
    telegram_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UpdateUserRequest(BaseModel):
    """Request model for updating a user"""
    telegram_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserResponse(BaseModel):
    """Response model for user data"""
    id: str
    telegram_id: Optional[int] = None
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
