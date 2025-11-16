"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import json
from urllib.parse import parse_qs

from app.database import get_session
from app.services.auth import AuthService
from app.schemas.auth import (
    TelegramAuthRequest,
    AuthTokenResponse,
    UserResponse,
    TelegramUserData,
)
from app.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/telegram", response_model=AuthTokenResponse)
async def telegram_auth(
    request: TelegramAuthRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Authenticate user via Telegram WebApp.

    Expects initData from Telegram WebApp in request body.
    Verifies signature and creates/updates user in database.
    Returns JWT access token.
    """
    try:
        # Parse initData (it's a query string)
        parsed_data = {}
        for item in request.init_data.split("&"):
            if "=" in item:
                key, value = item.split("=", 1)
                parsed_data[key] = value

        # Get user data from initData
        user_data_str = parsed_data.get("user")
        if not user_data_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No user data in initData",
            )

        # Decode user data
        import urllib.parse

        user_data_decoded = urllib.parse.unquote(user_data_str)
        user_data_json = json.loads(user_data_decoded)
        user_data = TelegramUserData(**user_data_json)

        # ⚠️ TODO: Verify signature using Telegram Bot Token
        # For now, we trust the data from Telegram WebApp
        # In production, implement proper signature verification
        # See: app/services/auth.py#verify_telegram_init_data

        # Create or update user in database
        user = await AuthService.create_or_update_user(
            session=session,
            telegram_id=str(user_data.id),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            username=user_data.username,
        )
        await session.commit()

        # Create access token
        access_token = AuthService.create_access_token(
            data={
                "user_id": user.id,
                "telegram_id": user.telegram_id,
                "username": user.username,
            }
        )

        return AuthTokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user data format",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}",
        )


@router.post("/verify")
async def verify_token(token: str):
    """Verify if token is valid."""
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    return {"status": "valid", "data": payload}
