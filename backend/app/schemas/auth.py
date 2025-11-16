"""Schemas for authentication requests and responses."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TelegramUserData(BaseModel):
    """Telegram user data from WebApp."""

    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None
    is_bot: bool = False
    is_premium: Optional[bool] = False


class TelegramAuthRequest(BaseModel):
    """Request for Telegram authentication."""

    init_data: str


class AuthTokenResponse(BaseModel):
    """Response with auth token."""

    access_token: str
    token_type: str = "bearer"
    user: Optional["UserResponse"] = None


class UserResponse(BaseModel):
    """User response schema."""

    id: Optional[int] = None
    telegram_id: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    """Token data stored in JWT."""

    user_id: int
    telegram_id: str
